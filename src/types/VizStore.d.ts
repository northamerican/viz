import type { Account, Playlist, Playlists, Queue } from "Viz";
import { SourceId } from "./VizSource";

export type VizStoreDbType = Pick<VizStore, "settings">;

export type VizStore = {
  videoEl: HTMLMediaElement;
  accounts: Account[];
  queues: QueueWithVideos[];
  view: {
    account: Account;
    playlists: Playlists;
    playlist: Playlist;
    queue: Queue;
  };

  settings: {
    sourceId: SourceId;
    downloadQueueItems: boolean;
  };

  updateSettings: () => Promise<void>;
  updateAccounts: () => Promise<void>;
  updateQueues: () => Promise<void>;
};
