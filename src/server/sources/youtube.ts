import cp from "child_process";
import fs from "fs";
import { join } from "path";
import ytdl from "@distube/ytdl-core";
import ffmpegPath from "ffmpeg-static";
import { VideosDb } from "../db/VideosDb.ts";
import {
  ffmpegLogLevel,
  ffmpegThreadQueueSize,
  hlsDir,
  sigtermCode,
} from "../consts.ts";
import type {
  CreateSearchQuery,
  GetVideoInfo,
  DownloadVideo,
} from "../../types/VizSource.d.ts";
import { SettingsDb } from "../db/SettingsDb.ts";

import { google, type youtube_v3 } from "googleapis";
import { VideoInfo, VideoThumbnail } from "Viz";
import { analysisProcess, filterProcess } from "./processVideo.ts";

const baseUrl = "https://youtu.be/";
const youtubeApi = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});

const createSearchQuery: CreateSearchQuery = (track) => {
  const { artist, name } = track;
  // TODO logic here, removing text beyond a dash or inside parens (ex: rework, remix?, remaster,)
  return `${artist} ${name} music video`;
};

const filterVideos = (items: youtube_v3.Schema$SearchResult[]) => {
  return items.filter(
    // TODO logic here, filtering out unwanted videos
    () => true
  );
};

const searchVideo = async (
  query: string
): Promise<youtube_v3.Schema$SearchResult[]> => {
  const response = await youtubeApi.search.list({
    part: ["snippet"],
    q: query,
    maxResults: 10,
    type: ["video"],
    safeSearch: "none",
  });

  return filterVideos(response.data.items);
};

const getVideoInfoFromSearchResults: GetVideoInfo = async (items) => {
  if (!items[0]) throw null;

  return {
    videoId: items[0].id.videoId,
    url: `${baseUrl}${items[0].id.videoId}`,
    thumbnail: items[0].snippet.thumbnails.default as VideoThumbnail,
    alternateVideos: items.slice(1).map((item) => ({
      id: item.id.videoId,
      name: item.snippet.title,
      author: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.default as VideoThumbnail,
    })),
  };
};

const getVideoInfo = async (videoId: string): Promise<VideoInfo> => {
  const detailsResponse = await youtubeApi.videos.list({
    part: ["snippet", "contentDetails"],
    id: [videoId],
  });

  const [video] = detailsResponse.data.items;

  return {
    videoId: video.id,
    url: `${baseUrl}${video.id}`,
    thumbnail: video.snippet.thumbnails.default as VideoThumbnail,
    alternateVideos: null,
  };
};

const downloadVideo: DownloadVideo = async ({ videoId, url }) => {
  const hlsVideoDir = join(hlsDir, videoId);
  const videoFilePath = join(hlsVideoDir, `${videoId}.mp4`);
  const wroteToDbMsg = `Wrote ${videoId} segments to videos db in`;
  const { maxQuality } = SettingsDb.settings;
  const logToConsole = false; // For debugging

  if (!fs.existsSync(hlsVideoDir)) {
    fs.mkdirSync(hlsVideoDir);
  }

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
      filter: (format) => {
        return format.container === "mp4";
      },
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

    let lastFrameMessage: string;
    let repeatCount = 1;
    const repeatLimit = 5;
    // For debugging
    // ffmpeg always outputs to stderr
    muxingProcess.stderr.on("data", (data) => {
      const dataStr = data.toString();

      if (logToConsole) {
        console.debug(dataStr);
      }

      // Track consecutive identical frame numbers to detect stalling
      const frameMessage = dataStr.match(/frame=\s*(\d+)/)?.[0];

      if (frameMessage && frameMessage === lastFrameMessage) {
        if (++repeatCount >= repeatLimit) {
          console.error("FFmpeg appears to be stalling. Killing process.");
          muxingProcess.kill();
        }
      } else if (frameMessage) {
        lastFrameMessage = frameMessage;
        repeatCount = 1;
      }
    });

    return new Promise((resolve, reject) => {
      audioStream.on("error", (err) => {
        reject(`Audio stream error: ${err.message}`);
      });
      videoStream.on("error", (err) => {
        reject(`Video stream error: ${err.message}`);
      });

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

  try {
    console.time(wroteToDbMsg);
    await muxingProcess();
    const analysisProps = await analysisProcess({ videoId, logToConsole });
    await filterProcess({ videoId, logToConsole, ...analysisProps });
    console.timeEnd(wroteToDbMsg);
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
  }

  return Promise.resolve();
};

export const youtube = {
  baseUrl,
  createSearchQuery,
  searchVideo,
  getVideoInfoFromSearchResults,
  getVideoInfo,
  downloadVideo,
};
