import cp from "child_process";
import fs from "fs";
import { join } from "path";
import ytsr from "ytsr"; // TODO deprecated lol
import ytdl from "@distube/ytdl-core";
import ffmpegPath from "ffmpeg-static";
import maxBy from "lodash.maxby";
import { VideosDb } from "../db/VideosDb.ts";
import { hlsDir } from "../consts.ts";
import {
  getSegmentDurations,
  durationTotal,
  durationToSeconds,
} from "../helpers.ts";
import type {
  CreateSearchQuery,
  GetVideoInfo,
  DownloadVideo,
} from "../../types/VizSource.d.ts";
import { aspectRatioFull, maxVideoDuration } from "../../consts.ts";
import { SettingsDb } from "../db/SettingsDb.ts";

const baseUrl = "https://youtu.be/";

const createSearchQuery: CreateSearchQuery = (track) => {
  const { artist, name } = track;
  // TODO logic here, removing text beyond a dash or inside parens (ex: rework, remix?, remaster,)
  return `${artist} ${name} music video`;
};

const filterVideos = (items: ytsr.Item[]): ytsr.Video[] | null => {
  const filteredItems = items.filter(
    //@ts-expect-error items is ytsr.Video[]
    ({ duration }) => duration && durationToSeconds(duration) < maxVideoDuration
    // TODO logic here, filtering out unwanted videos
  );

  return filteredItems.length ? (filteredItems as ytsr.Video[]) : null;
};

const getVideoInfo: GetVideoInfo = async (query: string) => {
  const filters1 = await ytsr.getFilters(query);
  const filter1 = filters1.get("Type").get("Video");
  const { items } = await ytsr(filter1.url, {
    safeSearch: false,
    limit: 20,
  });

  const videos = filterVideos(items);
  const video = videos[0];
  if (!video) throw null;

  const { id: videoId, url } = video;
  const thumbnail = maxBy(videos[0].thumbnails, "width");
  const alternateVideos = videos
    .slice(1)
    .map(({ id, title, author, thumbnails }) => ({
      id,
      name: title,
      author: author.name,
      thumbnail: maxBy(thumbnails, "width"),
    }));

  return {
    videoId,
    url,
    thumbnail,
    alternateVideos,
  };
};

const downloadVideo: DownloadVideo = async ({ videoId, url }) => {
  const hlsVideoDir = join(hlsDir, videoId);
  const videoFilePath = join(hlsVideoDir, `${videoId}.mp4`);
  const m3u8FilePath = join(hlsVideoDir, `${videoId}.m3u8`);
  const wroteToDbMsg = `Wrote ${videoId} segments to videos db in`;
  const { aspectRatioCorrectionFactor } = SettingsDb;
  const { maxQuality } = SettingsDb.settings;
  const logToConsole = false; // For debugging
  const ffmpegLogLevel = "32"; // 32 = ffmpeg default
  const ffmpegThreadQueueSize = "512";
  const sigtermCode = 255;

  if (!fs.existsSync(hlsVideoDir)) {
    fs.mkdirSync(hlsVideoDir);
  }

  type AnalysisProps = {
    cropWidth?: number;
    cropX?: number;
    measured_I: string;
    measured_TP: string;
    measured_LRA: string;
    measured_thresh: string;
    offset: string;
  };

  async function muxingProcess(): Promise<void> {
    console.log(`Downloading video ${videoId}...`);

    // Circumvent age-restricted videos
    const ageRestrictionCookieNames = [
      "__Secure-1PSID",
      "__Secure-1PSIDTS",
      "LOGIN_INFO",
    ];
    const ytCookies = ageRestrictionCookieNames.map((ytCookieName) => ({
      name: ytCookieName,
      secure: true,
      value: process.env[ytCookieName],
    }));

    const agent = ytdl.createAgent(ytCookies);
    const videoInfo = await ytdl.getInfo(url, { agent });
    const audioStream = ytdl.downloadFromInfo(videoInfo, {
      agent,
      quality: "highestaudio",
      filter: (format) => format.container === "mp4",
    });
    const videoStream = ytdl.downloadFromInfo(videoInfo, {
      agent,
      quality: "highestvideo",
      filter: (format) => {
        return format.codecs?.startsWith("avc1") && format.height <= maxQuality;
      },
    });

    const muxingProcess = cp.spawn(
      ffmpegPath,
      // prettier-ignore
      [
        "-loglevel", ffmpegLogLevel,
        // Pipe streams
        "-thread_queue_size", ffmpegThreadQueueSize,
        "-i", "pipe:3",
        "-thread_queue_size", ffmpegThreadQueueSize,
        "-i", "pipe:4",
        // Map audio and video
        "-map", "0:a",
        "-map", "1:v",
        "-c", "copy",
        // Overwrite file
        "-y",
        // Output
        "-f", "mp4",
        videoFilePath,
      ],
      {
        // prettier-ignore
        stdio: [
          // stdin, stdout, stderr
          "inherit",
          "inherit",
          "pipe",
          // audio, video
          "pipe",
          "pipe",
        ],
      }
    );

    await VideosDb.editVideo(videoId, {
      pid: muxingProcess.pid,
    });

    //@ts-expect-error nodejs dumb
    audioStream.pipe(muxingProcess.stdio[3]);
    //@ts-expect-error nodejs dumb
    videoStream.pipe(muxingProcess.stdio[4]);

    // For debugging
    // ffmpeg always outputs to stderr
    muxingProcess.stderr.on("data", async (data) => {
      if (logToConsole) {
        const dataStr = data.toString();
        console.debug(dataStr);
      }
    });

    return new Promise((resolve, reject) => {
      // Suppress errors in streams as they are interrupted on cancel / SIGTERM
      muxingProcess.stdio[3].on("error", () => {});
      muxingProcess.stdio[4].on("error", () => {});
      muxingProcess.on("close", async (code) => {
        if (code === sigtermCode) {
          return reject(sigtermCode);
        }

        resolve();
      });
    });
  }

  async function analysisProcess(): Promise<AnalysisProps> {
    console.log(`Analyzing video ${videoId}...`);

    const analysisProcess = cp.spawn(
      ffmpegPath,
      // prettier-ignore
      [
        "-i", videoFilePath,
        "-ss", "1", // Skip first second
        "-t", "60", // Limit 60 seconds
        "-vf", "cropdetect",
        "-af", "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json",
        "-f", "null",
        " -",
      ]
    );

    await VideosDb.editVideo(videoId, {
      pid: analysisProcess.pid,
    });

    const videoWidthRegex = /\s(\d+)x\d+[,\s]/;
    const cropdetectRegex = /w:(\d+).*x:(\d+)/;
    const cropdetectKey = "Parsed_cropdetect";
    const loudnormKey = "Parsed_loudnorm";
    const loudnormRegex = /{[\s\S]*}/;

    let videoInfoOutput: string;
    let cropdetectOutput: string;
    let loudnormOutput: string;

    analysisProcess.stderr.on("data", (data) => {
      const dataStr = data.toString();

      if (logToConsole) {
        console.debug(dataStr);
      }
      if (dataStr.includes(cropdetectKey) && cropdetectRegex.test(dataStr)) {
        cropdetectOutput = dataStr;
        return;
      }
      if (dataStr.includes(loudnormKey)) {
        loudnormOutput = dataStr.match(loudnormRegex);
        return;
      }
      if (videoWidthRegex.test(dataStr)) {
        videoInfoOutput = dataStr;
      }
    });

    return new Promise<AnalysisProps>((resolve, reject) => {
      analysisProcess.on("close", async (code) => {
        if (code === sigtermCode) {
          return reject(sigtermCode);
        }

        const isWidescreen = videoInfoOutput.includes("DAR 16:9");

        let cropWidth,
          cropX,
          measured_I,
          measured_TP,
          measured_LRA,
          measured_thresh,
          offset;

        if (isWidescreen) {
          try {
            const [, width] = videoInfoOutput
              .match(videoWidthRegex)
              .map(Number);

            const [, outputWidth, outputX] = cropdetectOutput
              .match(cropdetectRegex)
              .map(Number);

            // Account for pillarboxed 4:3 inside 16:9 videos with
            // artifacts making them appear a little narrower than they are.
            const maxAspectWidthThreshold = 0.05;
            const outputWidthRatio = width / outputWidth;
            const isPillarbox =
              Math.abs(outputWidthRatio - aspectRatioFull) <
              maxAspectWidthThreshold;

            if (isPillarbox) {
              [cropWidth, cropX] = [outputWidth, outputX];
            }
          } catch {
            //
          }
        }

        try {
          ({
            input_i: measured_I,
            input_tp: measured_TP,
            input_lra: measured_LRA,
            input_thresh: measured_thresh,
            target_offset: offset,
          } = JSON.parse(loudnormOutput));
        } catch {
          // TODO
        }

        return resolve({
          cropWidth,
          cropX,
          measured_I,
          measured_TP,
          measured_LRA,
          measured_thresh,
          offset,
        });
      });
    });
  }

  async function filterProcess({
    cropWidth,
    cropX,
    measured_I,
    measured_TP,
    measured_LRA,
    measured_thresh,
    offset,
  }: AnalysisProps) {
    console.log(`Processing video ${videoId}...`);

    const shouldCrop = cropWidth && cropX;
    const shouldCorrectAspectRatio = aspectRatioCorrectionFactor !== 1;
    const videoFilters = [
      shouldCrop ? `crop=${cropWidth}:ih:${cropX}:0` : "",
      shouldCorrectAspectRatio
        ? `scale=2*round((iw*${aspectRatioCorrectionFactor})/2):ih`
        : "",
      "setsar=1",
    ]
      .filter(Boolean)
      .join(",");
    const shouldLoudnorm = measured_I;
    const audioFilters = shouldLoudnorm
      ? `loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${measured_I}:measured_TP=${measured_TP}:measured_LRA=${measured_LRA}:measured_thresh=${measured_thresh}:offset=${offset}:linear=true`
      : "";
    // TODO ^ test that blank audioFilters works
    const filterComplex = `[0:v]${videoFilters}[v];[0:a]${audioFilters}[a]`;

    const filterProcess = cp.spawn(
      ffmpegPath,
      // prettier-ignore
      [
        "-loglevel", ffmpegLogLevel,
        "-thread_queue_size", ffmpegThreadQueueSize,
        "-i", videoFilePath,
        "-filter_complex", filterComplex,
        "-map", `[v]`, "-map", `[a]`,
        "-start_number", "0",
        "-hls_time", "10",
        "-hls_list_size", "0",
        "-f", "hls",
        m3u8FilePath,
      ]
    );

    await VideosDb.editVideo(videoId, {
      pid: filterProcess.pid,
    });

    filterProcess.stderr.on("data", async (data) => {
      const dataStr = data.toString();

      if (logToConsole) {
        console.debug(dataStr);
      }

      // Check for writing to file output
      const wroteToFileMsg = [".ts", "for writing"].every((str) =>
        dataStr.includes(str)
      );
      if (!wroteToFileMsg) return;

      // Write segments to video db as they are processed
      const segmentDurations = getSegmentDurations(m3u8FilePath);
      VideosDb.editVideo(videoId, {
        segmentDurations: segmentDurations,
        duration: segmentDurations.reduce(durationTotal, 0),
      });
    });

    return new Promise<void>((resolve, reject) => {
      filterProcess.on("close", async (code) => {
        if (code === sigtermCode) {
          return reject(sigtermCode);
        }

        const segmentDurations = getSegmentDurations(m3u8FilePath);
        await VideosDb.editVideo(videoId, {
          segmentDurations: segmentDurations,
          duration: segmentDurations.reduce(durationTotal, 0),
          downloaded: true,
          downloading: false,
          pid: null,
        });

        resolve();
      });
    });
  }

  try {
    console.time(wroteToDbMsg);
    await muxingProcess();
    // TODO move analysisProcess and filterProcess out of this file for use with any player
    const analysisProps = await analysisProcess();
    await filterProcess(analysisProps);
  } catch (e) {
    if (e === sigtermCode) {
      console.log(`User cancelled download of video ${videoId}.`);
      VideosDb.editVideo(videoId, {
        downloading: false,
        error: null,
        pid: null,
      });
      return Promise.resolve();
    }
    const error = e instanceof Error ? e.message : String(e);
    console.error(`An error occurred downloading ${videoId}.`);
    console.error(error);
    await VideosDb.editVideo(videoId, {
      downloading: false,
      error,
      pid: null,
    });
  } finally {
    console.timeEnd(wroteToDbMsg);
  }

  return Promise.resolve();
};

export const youtube = {
  baseUrl,
  createSearchQuery,
  getVideoInfo,
  downloadVideo,
};
