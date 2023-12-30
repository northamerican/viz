declare module "VizPlayer" {
  import { Playlist, PlaylistList } from "Viz";
  export type GetToken = (
    code: string,
    refresh?: boolean,
  ) => Promise<{ access_token: string; refresh_token: string }>;
  export type GetPlaylists = (
    offset?: number,
  ) => Promise<Partial<PlaylistList>>;
  export type GetPlaylist = (playlistId: string) => Promise<Playlist>;
}
