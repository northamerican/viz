import type { AccountDbItem, Playlist, PlaylistList } from "Viz";
import { AxiosInstance } from "axios";
import { google } from "googleapis";

export interface VizPlayer {
  #account: AccountDbItem;
  #axios?: AxiosInstance;
  #oauth2Client?: google.auth.OAuth2;

  getProfile(
    token: string
  ): Promise<{ id: string; displayName: string; profileUrl: string }>;
  login(
    code: string,
    refresh?: boolean
  ): Promise<{ access_token: string; refresh_token: string }>;
  logout(): Promise<void>;
  remove(): Promise<void>;
  getPlaylist(playlistId: string): Promise<Playlist>;
  getPlaylists(offset?: number): Promise<Partial<PlaylistList>>;
}
export interface VizPlayerConstructable {
  new (accountId?: string): VizPlayer;
  authorize(): string;
}

export type Players = {
  [playerId: string]: {
    id: PlayerId;
    name: string;
  };
};

// export type PlayerId = keyof typeof players;
export type PlayerId = "spotify" | "youtube";
