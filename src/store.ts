import { reactive } from "vue";
import {
  onSaveStore,
  onUpdateStore,
  onUpdateAccountsStore,
  onUpdateQueueStore,
} from "./store.telefunc";
import { VizStore } from "./types/VizStore";

// TODO add 'view'
// const persistKeys = ["isPlaying", "sourceId"];

export const store = reactive<VizStore>({
  videoEl: null,
  isPlaying: false,
  sourceId: "youtube",
  accounts: [],
  view: {
    // Library
    account: null,
    playlists: null,
    playlist: null,
    queue: null,
  },
  queue: null, // TODO queues
  async saveStore() {
    // onSaveStore(
    //   Object.fromEntries(
    //     persistKeys.map((key) => [key, store[key]])
    //   ) as PersistedVizStore
    // );
    onSaveStore({
      isPlaying: store.isPlaying,
      sourceId: store.sourceId,
    });
  },
  async updateStore() {
    Object.assign(this, await onUpdateStore());
  },
  async updateAccountsStore() {
    this.accounts = await onUpdateAccountsStore();
  },
  async updateQueueStore() {
    this.queue = await onUpdateQueueStore();
  },
});
