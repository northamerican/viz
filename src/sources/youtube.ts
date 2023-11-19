import fs from "fs";
import ytsr from "ytsr";
import ytdlMuxer from "../ytdl-muxer.ts";
import {
  maxVideoDuration,
  mp4Dir
} from "../consts.ts";
import type { Track } from "../types/viz";

function durationToSeconds(duration: string) {
  return duration.split(":").reduce((acc, time) => 60 * acc + +time, 0);
}

const createSearchQuery = (track: Partial<Track>) => {
  const { artist, title } = track;

  // TODO logic here, removing text beyond a dash or inside parens (ex: rework, remix?, remaster,)

  return `${artist} ${title} music video`;
}
const getVideo = async (query: string) => {
  const filters1 = await ytsr.getFilters(query);
  const filter1 = filters1.get("Type").get("Video");
  const { items } = await ytsr(filter1.url, {
    safeSearch: false,
    limit: 20,
  });

  const filterItems = items.filter(
    // @ts-ignore
    ({ duration }) => {
      return duration && durationToSeconds(duration) < maxVideoDuration;
    }
    // TODO logic here, filtering out unwanted videos
  );

  if (!filterItems.length) return null;

  // @ts-ignore
  const { id: videoId, url } = filterItems[0];
  const video = ytdlMuxer(url);

  return { video, videoId };
}


function writeVideoStream(video, id) {
  const videoPath = mp4Dir + `${id}.mp4`;
  video.pipe(fs.createWriteStream(videoPath));

  return video;
}

export const youtube = {
  writeVideoStream,
  createSearchQuery,
  getVideo,
}