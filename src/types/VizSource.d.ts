
declare module "VizSource" {
  import { Track } from 'Viz'
  export type CreateSearchQuery = (track: { artist: string, name: string }) => string
  export type GetVideoUrl = (query: string) => Promise<{ videoId: string, url: string }>
  export type WriteVideo = ({
    videoId: string,
    url: string
  }) => PassThrough
  export type WriteVideoStream = (video: PassThrough, id: string) => PassThrough
}

