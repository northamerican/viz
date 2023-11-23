
declare module "VizSource" {
  import { Track } from 'Viz'
  export type CreateSearchQuery = (track: Partial<Track>) => string
  export type GetVideo = (query: string) => Promise<PassThrough>
  export type WriteVideoStream = (video: PassThrough, id: string) => PassThrough
}

