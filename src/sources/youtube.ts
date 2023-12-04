import ytsr from "ytsr";
import youtubeToHls from "../youtubeToHls.ts";
import { VideosDb } from "../db/VideosDb.ts";
import type {
  CreateSearchQuery,
  GetVideo,
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

const getVideo: GetVideo = async (query: string) => {
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

  youtubeToHls({ videoId, url });
  return { videoId };
}

export const youtube = {
  createSearchQuery,
  getVideo,
}