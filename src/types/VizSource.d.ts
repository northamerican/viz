import type { VideoInfo } from "Viz";

export type CreateSearchQuery = (track: {
  artist: string;
  name: string;
}) => string;
export type GetVideoInfo = (query: string) => Promise<VideoInfo>;
export type DownloadVideo = ({ videoId: string, url: string }) => Promise<void>;

export type SourceId = "youtube";
