import cp from "child_process";
import fs from "fs";
import { join } from "path";
import ffmpegPath from "ffmpeg-static";
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
} from "../../types/VizSource";
import { SettingsDb } from "../db/SettingsDb.ts";
import { VideosDb } from "../db/VideosDb.ts";

import { google, type youtube_v3 } from "googleapis";
import { VideoInfo, VideoThumbnail } from "Viz";
import { analysisProcess, filterProcess } from "./processVideo.ts";
import { Payload } from "youtube-dl-exec";

const baseUrl = "https://www.youtube.com/watch?v=";
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

    const ytDlpPath =
      "/Users/home/Documents/viz/node_modules/youtube-dl-exec/bin/yt-dlp";

    const ytdlOutput = await new Promise<{ stdout: string; stderr: string }>(
      (resolve, reject) => {
        cp.exec(
          `"${ytDlpPath}" "${url}" --cookies-from-browser "safari" --dump-single-json`,
          (error, stdout, stderr) => {
            if (error) {
              console.error("yt-dlp error output:", stderr);
              reject(error);
              return;
            }
            resolve({ stdout, stderr });
          }
        );
      }
    );

    const videoInfo: Payload = JSON.parse(ytdlOutput.stdout);
    console.log(`Got video info for ${videoId}`);

    // Find best audio format (sort by bitrate)
    const audioFormats = videoInfo.formats
      .filter((format) => format.acodec !== "none" && format.vcodec === "none")
      .sort((a, b) => b.abr - a.abr);

    // Find best video format that meets max quality setting (sort by resolution)
    const videoFormats = videoInfo.formats
      .filter(
        (format) =>
          format.vcodec !== "none" &&
          format.acodec === "none" &&
          format.height <= maxQuality
      )
      .sort((a, b) => b.height - a.height);

    if (!audioFormats.length || !videoFormats.length) {
      throw new Error(
        `Couldn't find suitable audio/video formats for ${videoId}`
      );
    }

    const bestAudio = audioFormats[0];
    const bestVideo = videoFormats[0];

    // Download audio stream with cp.exec instead of youtubedl.exec
    const audioProcess = cp.spawn(ytDlpPath, [
      url,
      "--output",
      "-",
      "--format",
      bestAudio.format_id,
      "--cookies-from-browser",
      "safari",
    ]);

    // Download video stream with cp.exec instead of youtubedl.exec
    const videoProcess = cp.spawn(ytDlpPath, [
      url,
      "--output",
      "-",
      "--format",
      bestVideo.format_id,
      "--cookies-from-browser",
      "safari",
    ]);

    // Create readable streams from processes
    const audioStream = audioProcess.stdout;
    const videoStream = videoProcess.stdout;

    // Handle errors on the processes themselves
    audioProcess.on("error", (err) => {
      console.error("Audio process error:", err);
    });

    videoProcess.on("error", (err) => {
      console.error("Video process error:", err);
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
    const repeatLimit = 10;
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
