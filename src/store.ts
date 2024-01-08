import { Account, Playlist, Playlists, Queue } from "Viz";
import { reactive } from "vue";
import { onUpdateQueueStore } from "./components/Queue.telefunc";
import { onUpdateAccountsStore } from "./components/Account.telefunc";

type VizStore = {
  videoEl: HTMLMediaElement;
  accounts: Account[];
  view: {
    account: Account;
    playlists: Playlists;
    playlist: Playlist;
    queue: Queue;
  };
  updateAccountsStore: () => Promise<void>;
  queue: Queue;
  updateQueueStore: () => Promise<void>;
};

export const store = reactive<VizStore>({
  videoEl: null,
  accounts: [],
  view: {
    account: null,
    playlists: null,
    playlist: null,
    queue: null,
  },
  async updateAccountsStore() {
    this.accounts = await onUpdateAccountsStore();
  },
  queue: null, // TODO queues
  async updateQueueStore() {
    this.queue = await onUpdateQueueStore();
  },
});
