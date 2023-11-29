import fs from "fs";
import ytsr from "ytsr";
import { join } from "path";
import ytdlMuxer from "../ytdlMuxer.ts";
import {
  mp4Dir
} from "../consts.ts";
import toHls from "../toHls.ts";
import { VideosDb } from "../db/VideosDb.ts";
import type {
  CreateSearchQuery,
  GetVideo,
  WriteVideoStream
} from "VizSource";

const maxVideoDuration = 12 * 60;

function durationToSeconds(duration: string) {
  return duration.split(":").reduce((acc, time) => 60 * acc + +time, 0);
}

const createSearchQuery: CreateSearchQuery = (track) => {
  const { artist, title } = track;

  // TODO logic here, removing text beyond a dash or inside parens (ex: rework, remix?, remaster,)

  return `${artist} ${title} music video`;
}

const pickVideo = (items: ytsr.Item[]): ytsr.Video | null => {
  const filterItems = items.filter(
    // @ts-ignore
    ({ duration }) => {
      return duration && durationToSeconds(duration) < maxVideoDuration;
    }
    // TODO logic here, filtering out unwanted videos
  );

  return filterItems[0] as ytsr.Video || null
}

const getVideo: GetVideo = async (query: string) => {
  const filters1 = await ytsr.getFilters(query);
  const filter1 = filters1.get("Type").get("Video");
  const { items } = await ytsr(filter1.url, {
    safeSearch: false,
    limit: 20,
  });

  const { id: videoId, url } = pickVideo(items);
  const video = ytdlMuxer(url);

  VideosDb.addVideo({
    id: videoId,
    source: 'youtube',
    sourceUrl: url,
    duration: 0,
    downloaded: false,
    downloading: true,
    segmentDurations: []
  })

  return { video, videoId };
}

const writeVideoStream: WriteVideoStream = (video, videoId) => {
  const videoPath = join(mp4Dir, `${videoId}.mp4`);

  video.pipe(fs.createWriteStream(videoPath));
  video.on("finish", () => {
    console.log(`Got video ${videoId}`)

    toHls(videoId)
  });

  return video;
}

export const youtube = {
  writeVideoStream,
  createSearchQuery,
  getVideo,
}