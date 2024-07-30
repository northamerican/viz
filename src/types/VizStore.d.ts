import type { Account, Playlist, Playlists, Queue, QueueWithVideos } from "Viz";
import { SourceId } from "./VizSource";

export type VizStoreDbType = Pick<VizStore, "settings">;

export type ReceiverAspectRatios = number;
export type DisplayAspectRatios = number;

export type VizSettings = {
  sourceId: SourceId;
  downloadQueueItems: boolean;
  maxQuality: 720 | 1080 | 1440 | 2160;
  receiverAspectRatio: ReceiverAspectRatios;
  displayAspectRatio: DisplayAspectRatios;
};

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
  settings: VizSettings;

  updateSettings: () => Promise<void>;
  updateAccounts: () => Promise<void>;
  updateQueues: () => Promise<void>;
};
