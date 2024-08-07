import { reactive } from "vue";
import {
  onServerEvent,
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

  // Polling for a server event
  async onServerEvent(eventName, callback) {
    await onServerEvent(eventName);
    await callback();
    // Recursive polling
    this.onServerEvent(eventName, callback);
  },
});
