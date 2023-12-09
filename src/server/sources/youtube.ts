import cp from "child_process";
import stream from "stream";
import fs from "fs";
import { join } from "path";
import ytsr from "ytsr";
import ytdl from "@distube/ytdl-core";
import ffmpegPath from "ffmpeg-static";
import { VideosDb } from "../db/VideosDb.ts";
import { hlsDir } from "../../consts.ts";
import { getSegmentDurations, durationTotal } from "../helpers.ts";
import type {
  CreateSearchQuery,
  GetVideoUrl,
  WriteVideo,
} from "VizSource";

const maxVideoDuration = 12 * 60;

function durationToSeconds(duration: string) {
  return duration.split(":").reduce((acc, time) => 60 * acc + +time, 0);
}

const createSearchQuery: CreateSearchQuery = (track) => {
  const { artist, name } = track;

  // TODO logic here, removing text beyond a dash or inside parens (ex: rework, remix?, remaster,)

  return `${artist} ${name} music video`;
}

const filterVideo = (items: ytsr.Item[]): ytsr.Video | null => {
  const filterItems = items.filter(
    // @ts-ignore
    ({ duration }) => {
      return duration && durationToSeconds(duration) < maxVideoDuration;
    }
    // TODO logic here, filtering out unwanted videos
  );

  return filterItems[0] as ytsr.Video || null
}

const getVideoUrl: GetVideoUrl = async (query: string) => {
  const filters1 = await ytsr.getFilters(query);
  const filter1 = filters1.get("Type").get("Video");
  const { items } = await ytsr(filter1.url, {
    safeSearch: false,
    limit: 20,
  });

  const { id: videoId, url } = filterVideo(items);

  // TODO handle no video found 

  VideosDb.addVideo({
    id: videoId,
    source: 'youtube',
    sourceUrl: url,
    duration: 0,
    downloaded: false,
    downloading: true,
    segmentDurations: []
  })

  return { videoId, url };
}

const writeVideo: WriteVideo = async ({ videoId, url }) => {
  const hlsVideoDir = join(hlsDir, videoId)
  const videoFilePath = join(hlsVideoDir, `${videoId}.m3u8`);

  if (!fs.existsSync(hlsVideoDir)) {
    fs.mkdirSync(hlsVideoDir);
  }

  const ytStream = new stream.PassThrough({
    highWaterMark: 1024 * 512
  });

  const wroteToDbMsg = `Wrote ${videoId} segments to videos db in`
  console.log(`Generating HLS files for video ${videoId}`)
  console.time(wroteToDbMsg)

  const info = await ytdl.getInfo(url)

  const audioStream = ytdl.downloadFromInfo(info, {
    quality: "highestaudio",
    filter: format => format.container === 'mp4'
  });
  const videoStream = ytdl.downloadFromInfo(info, {
    quality: "highestvideo",
    filter: format => format.codecs.startsWith('avc1')
  });
  const process = cp.spawn(
    ffmpegPath,
    [
      "-loglevel", "32",
      //
      "-i", "pipe:3",
      //
      "-i", "pipe:4",
      // Map audio and video
      "-map", "0:a",
      "-map", "1:v",
      // No conversion
      "-c", "copy",
      // TODO is this needed? 
      "-movflags", "frag_keyframe+empty_moov",
      //
      "-start_number", "0",
      "-hls_time", "10",
      "-hls_list_size", "0 ",
      "-f", "hls",
      videoFilePath,
    ],
    {
      stdio: [
        // stdin, stdout, stderr
        "inherit", "inherit", "pipe",
        // audio, video
        "pipe", "pipe",
      ],
    }
  );
  // @ts-ignore
  audioStream.pipe(process.stdio[3]);
  // @ts-ignore
  videoStream.pipe(process.stdio[4]);

  // @ts-ignore
  process.stdio[2].on('data', (data: any) => {
    // TODO could maybe just do this on 'close', ie the end of the video loaded ?
    // For debugging
    // console.log(data.toString())

    // TODO remove this hack
    // Data can be received before the creation of the m3u file
    if (!fs.existsSync(videoFilePath)) return

    VideosDb.editVideo(videoId, {
      segmentDurations: getSegmentDurations(videoFilePath),
      duration: getSegmentDurations(videoFilePath).reduce(durationTotal, 0),
    })
  })

  process
    .on('close', async () => {
      VideosDb.editVideo(videoId, {
        downloaded: true,
        downloading: false,
      })

      console.timeEnd(wroteToDbMsg)
    });

  return ytStream;
}

export const youtube = {
  createSearchQuery,
  getVideoUrl,
  writeVideo
}