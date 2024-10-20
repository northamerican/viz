import type { youtube_v3 } from "googleapis";
import type { VideoInfo } from "Viz";

export type CreateSearchQuery = (track: {
  artist: string;
  name: string;
}) => string;
export type GetVideoInfo = (
  items: youtube_v3.Schema$SearchResult[]
) => Promise<VideoInfo>;
export type DownloadVideo = ({ videoId: string, url: string }) => Promise<void>;

export type SourceId = "youtube";
