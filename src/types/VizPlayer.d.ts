
declare module "VizPlayer" {
  import { Track, Playlist, PlaylistList } from 'Viz'
  import { Request } from 'express'
  export type GetToken = (code: string, refresh?: boolean) => Promise<{ access_token: string, refresh_token: string }>
  export type GetPlaylists = (offset?: number) => Promise<PlaylistList>
  export type GetPlaylist = (playlistId: string) => Promise<Playlist>
}