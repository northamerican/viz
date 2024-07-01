import { reactive } from "vue";
import {
  onGetAccountsAsArray,
  onGetQueuesWithVideos,
  onGetSettings,
} from "./store.telefunc";
import { VizStore } from "./types/VizStore";

export const store = reactive<VizStore>({
  videoEl: null,
  accounts: [],
  queues: [],
  view: {
    // Library
    account: null,
    playlists: null,
    playlist: null,
    queue: null,
  },

  settings: {
    sourceId: "youtube",
    downloadQueueItems: true,
  },

  async updateSettings() {
    this.settings = await onGetSettings();
  },
  async updateAccounts() {
    this.accounts = await onGetAccountsAsArray();
  },
  async updateQueues() {
    this.queues = await onGetQueuesWithVideos();
  },
});
