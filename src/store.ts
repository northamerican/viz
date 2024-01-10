import { Account, Playlist, Playlists, Queue } from "Viz";
import { reactive } from "vue";
import { onUpdateQueueStore } from "./components/Queue.telefunc";
import { onUpdateAccountsStore } from "./components/Account.telefunc";
import { SourceId } from "./types/VizSource";

type VizStore = {
  videoEl: HTMLMediaElement;
  source: SourceId;
  accounts: Account[];
  view: {
    account: Account;
    playlists: Playlists;
    playlist: Playlist;
    queue: Queue;
  };
  queue: Queue;
  updateAccountsStore: () => Promise<void>;
  updateQueueStore: () => Promise<void>;
};

export const store = reactive<VizStore>({
  videoEl: null,
  source: "youtube",
  accounts: [],
  view: {
    // Library
    account: null,
    playlists: null,
    playlist: null,
    queue: null,
  },
  queue: null, // TODO queues
  async updateAccountsStore() {
    this.accounts = await onUpdateAccountsStore();
  },
  async updateQueueStore() {
    this.queue = await onUpdateQueueStore();
  },
});
