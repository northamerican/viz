import cp from "child_process";
import fs from "fs";
import { join } from "path";
import ytsr from "ytsr"; // TODO deprecated lol
import ytdl from "@distube/ytdl-core";
import ffmpegPath from "ffmpeg-static";
// import maxBy from "lodash.maxby";
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
import { maxVideoDuration } from "../../consts.ts";
import { StoreDb } from "../db/StoreDb.ts";
import maxBy from "lodash.maxby";
// import chrome from "chrome-cookies-secure";

const baseUrl = "https://youtu.be/";

const createSearchQuery: CreateSearchQuery = (track) => {
  const { artist, name } = track;
  // TODO logic here, removing text beyond a dash or inside parens (ex: rework, remix?, remaster,)
  return `${artist} ${name} music video`;
};

const filterVideos = (items: ytsr.Item[]): ytsr.Video[] | null => {
  const filteredItems = items.filter(
    //@ts-expect-error ytsr is wrong
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

const cancelDownload = async (videoId: string) => {
  console.log(`User cancelled download of video ${videoId}.`);
  return await VideosDb.editVideo(videoId, {
    downloading: false,
    error: null,
    pid: null,
  });
};

const downloadVideo: DownloadVideo = async ({ videoId, url }) => {
  const hlsVideoDir = join(hlsDir, videoId);
  const videoFilePath = join(hlsVideoDir, `${videoId}.mp4`);
  const m3u8FilePath = join(hlsVideoDir, `${videoId}.m3u8`);
  const wroteToDbMsg = `Wrote ${videoId} segments to videos db in`;
  const { aspectRatioCorrectionFactor } = StoreDb;
  const { maxQuality } = StoreDb.settings;
  const ffmpegThreadQueueSize = "512";

  if (!fs.existsSync(hlsVideoDir)) {
    fs.mkdirSync(hlsVideoDir);
  }

  console.log(`Downloading video ${videoId}...`);
  console.time(wroteToDbMsg);

  // const cookies: unknown = [];
  // const cookies = await chrome.getCookiesPromised(
  //   "https://www.youtube.com",
  //   "object",
  //   "Default"
  // );

  // Circumvent age-restricted videos
  const ytCookies = ["__Secure-1PSID", "__Secure-1PSIDTS", "LOGIN_INFO"].map(
    (ytCookieName) => ({
      name: ytCookieName,
      secure: true,
      value: process.env[ytCookieName],
    })
  );
  const agent = ytdl.createAgent(ytCookies);

  try {
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

    // const { width, height } = maxBy(videoInfo.formats, "width");
    // const videoAspectRatio = width / height;

    const muxingProcess = cp.spawn(
      ffmpegPath,
      [
        "-loglevel",
        "32",

        "-thread_queue_size",
        ffmpegThreadQueueSize,
        "-i",
        "pipe:3",

        "-thread_queue_size",
        ffmpegThreadQueueSize,
        "-i",
        "pipe:4",

        // Map audio and video
        "-map",
        "0:a",
        "-map",
        "1:v",
        "-c",
        "copy",

        // Overwrite file
        "-y",
        // Output
        "-f",
        // "hls",
        "mp4",
        videoFilePath,
      ],
      {
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
    //@ts-expect-error nodejs dumb
    audioStream.pipe(muxingProcess.stdio[3]);
    //@ts-expect-error nodejs dumb
    videoStream.pipe(muxingProcess.stdio[4]);

    await VideosDb.editVideo(videoId, {
      pid: muxingProcess.pid,
    });

    // For debugging
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    muxingProcess.stdio[2].on("data", async (_data) => {
      // console.log(_data.toString());
    });

    return new Promise((resolve) => {
      muxingProcess.on("close", async (code) => {
        if (code === 255) {
          await cancelDownload(videoId);
          return resolve();
        }

        // const videoFilter = `[1:v]scale=2*round((iw*${aspectRatioCorrectionFactor})/2):ih,setsar=1[v]`;
        const videoFilter = `scale=2*round((iw*${aspectRatioCorrectionFactor})/2):ih,setsar=1`;
        // TODO crop/scale videos wider than 16:9

        console.log(`Processing video ${videoId}...`);
        const filterProcess = cp.spawn(ffmpegPath, [
          "-loglevel",
          "32",

          "-thread_queue_size",
          ffmpegThreadQueueSize,

          "-i",
          videoFilePath,

          "-filter_complex",
          videoFilter,

          "-start_number",
          "0",
          "-hls_time",
          "10",
          "-hls_list_size",
          "0 ",

          "-f",
          "hls",
          m3u8FilePath,
        ]);

        await VideosDb.editVideo(videoId, {
          pid: filterProcess.pid,
        });

        filterProcess.stdio[2].on("data", async (data) => {
          // Check for writing to file output
          const wroteToFile = [".ts", "for writing"].every((str) =>
            data.toString().includes(str)
          );

          // Write segments to video db
          if (wroteToFile) {
            try {
              VideosDb.editVideo(videoId, {
                segmentDurations: getSegmentDurations(m3u8FilePath),
                duration: getSegmentDurations(m3u8FilePath).reduce(
                  durationTotal,
                  0
                ),
              });
            } catch {
              // TODO
            }
          }
        });
        filterProcess.on("close", async (code) => {
          if (code === 255) {
            await cancelDownload(videoId);
            return resolve();
          }

          await VideosDb.editVideo(videoId, {
            segmentDurations: getSegmentDurations(m3u8FilePath),
            duration: getSegmentDurations(m3u8FilePath).reduce(
              durationTotal,
              0
            ),
            downloaded: true,
            downloading: false,
            pid: null,
          });

          // TODO process.uptime() (maybe before close?)
          console.timeEnd(wroteToDbMsg);
          resolve();
        });
      });
    });
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.error(error);

    await VideosDb.editVideo(videoId, {
      downloading: false,
      error,
      pid: null,
    });

    return Promise.resolve();
  }
};

export const youtube = {
  baseUrl,
  createSearchQuery,
  getVideoInfo,
  downloadVideo,
};
