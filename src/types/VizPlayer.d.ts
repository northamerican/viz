import { AccountDbItem, Playlist, PlaylistList } from "Viz";
import { AxiosInstance } from "axios";
import players from "../players";

export interface VizPlayer {
  #account: AccountDbItem;
  #axios: AxiosInstance;

  getProfile(token: string): Promise<{ id: string; displayName: string }>;
  login(
    code: string,
    refresh?: boolean
  ): Promise<{ access_token: string; refresh_token: string }>;
  logout(): void;
  getPlaylist(playlistId: string): Promise<Playlist>;
  getPlaylists(offset?: number): Promise<Partial<PlaylistList>>;
}
interface VizPlayerConstructable {
  new (accountId?: string): VizPlayer;
  authorize(): string;
}

export type Players = {
  [playerId: string]: {
    id: string;
    name: string;
  };
};

export type PlayerId = keyof typeof players;
