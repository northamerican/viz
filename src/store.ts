import { computed, reactive } from "vue";
import {
  onGetAccountsAsArray,
  onGetQueuesWithVideos,
  onGetSettings,
} from "./store.telefunc";
import { VizStore } from "./types/VizStore";

export const store: VizStore = reactive({
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
    sourceId: null,
    downloadQueueItems: null,
    maxQuality: null,
    receiverAspectRatio: null,
    displayAspectRatio: null,
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
