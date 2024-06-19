import { reactive } from "vue";
import {
  onSaveStore,
  onUpdateStore,
  onUpdateAccountsStore,
  onUpdateQueuesStore,
} from "./store.telefunc";
import { VizStore } from "./types/VizStore";

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
  queues: [],
  async saveStore() {
    // TODO
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
  async updateQueuesStore() {
    this.queues = await onUpdateQueuesStore();
  },
});
