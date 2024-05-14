import type { Account, Playlist, Playlists, Queue } from "Viz";
import { SourceId } from "./VizSource";

export type VizStore = {
  videoEl: HTMLMediaElement;
  isPlaying: boolean;
  sourceId: SourceId;
  accounts: Account[];
  view: {
    account: Account;
    playlists: Playlists;
    playlist: Playlist;
    queue: Queue;
  };
  queue: Queue;
  saveStore: () => Promise<void>;
  updateStore: () => Promise<void>;
  updateAccountsStore: () => Promise<void>;
  updateQueueStore: () => Promise<void>;
};

export type PersistedVizStore = Pick<VizStore, "sourceId" | "isPlaying">;
