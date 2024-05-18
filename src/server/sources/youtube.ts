import cp from "child_process";
import fs from "fs";
import { join } from "path";
import ytsr from "ytsr";
import ytdl from "@distube/ytdl-core";
import ffmpegPath from "ffmpeg-static";
import { VideosDb } from "../db/VideosDb.ts";
import { hlsDir } from "../consts.ts";
import { getSegmentDurations, durationTotal } from "../helpers.ts";
import type {
  CreateSearchQuery,
  GetVideoUrl,
  DownloadVideo,
} from "../../types/VizSource.d.ts";

const maxVideoDuration = 12 * 60;

function durationToSeconds(duration: string) {
  return duration.split(":").reduce((acc, time) => 60 * acc + +time, 0);
}

const createSearchQuery: CreateSearchQuery = (track) => {
  const { artist, name } = track;
  // TODO logic here, removing text beyond a dash or inside parens (ex: rework, remix?, remaster,)
  return `${artist} ${name} music video`;
};

const filterVideo = (items: ytsr.Item[]): ytsr.Video | null => {
  const filterItems = items.filter(
    //@ts-expect-error ytsr is wrong
    ({ duration }) => duration && durationToSeconds(duration) < maxVideoDuration
    // TODO logic here, filtering out unwanted videos
  );

  return (filterItems[0] as ytsr.Video) || null;
};

const getVideoUrl: GetVideoUrl = async (query: string) => {
  const filters1 = await ytsr.getFilters(query);
  const filter1 = filters1.get("Type").get("Video");
  const { items } = await ytsr(filter1.url, {
    safeSearch: false,
    limit: 20,
  });

  const video = filterVideo(items);
  if (!video) throw null;

  const { id: videoId, url } = video;

  return { videoId, url };
};

const downloadVideo: DownloadVideo = async ({ videoId, url }) => {
  const hlsVideoDir = join(hlsDir, videoId);
  const videoFilePath = join(hlsVideoDir, `${videoId}.m3u8`);
  const wroteToDbMsg = `Wrote ${videoId} segments to videos db in`;

  if (!fs.existsSync(hlsVideoDir)) {
    fs.mkdirSync(hlsVideoDir);
  }

  console.log(`Generating HLS files for video ${videoId}`);
  console.time(wroteToDbMsg);

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
    const info = await ytdl.getInfo(url, { agent });
    const audioStream = ytdl.downloadFromInfo(info, {
      agent,
      quality: "highestaudio",
      filter: (format) => format.container === "mp4",
    });
    const videoStream = ytdl.downloadFromInfo(info, {
      agent,
      quality: "highestvideo",
      filter: (format) => format.codecs.startsWith("avc1"),
    });

    const process = cp.spawn(
      ffmpegPath,
      [
        "-loglevel",
        "32",
        //
        "-i",
        "pipe:3",
        //
        "-i",
        "pipe:4",
        // Map audio and video
        "-map",
        "0:a",
        "-map",
        "1:v",
        // No conversion
        "-c",
        "copy",
        // TODO is this needed?
        // "-movflags",
        // "frag_keyframe+empty_moov",
        //
        "-start_number",
        "0",
        "-hls_time",
        "10",
        "-hls_list_size",
        "0 ",
        "-f",
        "hls",
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
    audioStream.pipe(process.stdio[3]);
    //@ts-expect-error nodejs dumb
    videoStream.pipe(process.stdio[4]);

    // process.stdio[2].on("data", async () => {
    //   // TODO could maybe just do this on 'close', ie the end of the video loaded ?
    //   // For debugging
    //   // console.log(data.toString())

    //   // TODO remove this hack
    //   // Data can be received before the creation of the m3u file
    //   if (!fs.existsSync(videoFilePath)) return;

    //   // TODO prob not necessary
    //   await VideosDb.editVideo(videoId, {
    //     segmentDurations: getSegmentDurations(videoFilePath),
    //     duration: getSegmentDurations(videoFilePath).reduce(durationTotal, 0),
    //   });
    // });

    return new Promise((resolve) => {
      process.on("close", async () => {
        await VideosDb.editVideo(videoId, {
          segmentDurations: getSegmentDurations(videoFilePath),
          duration: getSegmentDurations(videoFilePath).reduce(durationTotal, 0),
          downloaded: true,
          downloading: false,
        });

        console.timeEnd(wroteToDbMsg);
        resolve({ videoId, url });
      });
    });
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);

    await VideosDb.editVideo(videoId, {
      downloading: false,
      error,
    });

    return Promise.resolve({ videoId, url });
  }
};

export const youtube = {
  createSearchQuery,
  getVideoUrl,
  downloadVideo,
};
