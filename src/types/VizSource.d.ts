import { TrackType } from "Viz";

export type CreateSearchQuery = (track: {
  artist: string;
  name: string;
  type: TrackType;
}) => string;
export type GetVideoUrl = (
  query: string
) => Promise<{ videoId: string; url: string }>;
export type DownloadVideo = ({
  videoId: string,
  url: string,
}) => Promise<{ videoId: string; url: string }>;

export type SourceId = "youtube";
