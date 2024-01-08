declare module "VizSource" {
  export type CreateSearchQuery = (track: {
    artist: string;
    name: string;
  }) => string;
  export type GetVideoUrl = (
    query: string
  ) => Promise<{ videoId: string; url: string }>;
  export type DownloadVideo = ({
    videoId: string,
    url: string,
  }) => Promise<{ videoId: string; url: string }>;
}
