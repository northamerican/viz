import { JSONFilePreset } from "lowdb/node";
import { storeDbPath } from "../consts";
import sources from "../sources";
import { VizStoreDbType } from "../../types/VizStore";
import { store } from "../../store";

const storeDbDefault: VizStoreDbType = {
  // TODO view:
  settings: {
    sourceId: "youtube",
    downloadQueueItems: true,
  },
};

const storeDb = await JSONFilePreset<VizStoreDbType>(
  storeDbPath,
  storeDbDefault
);
await storeDb.read();

export const StoreDb = {
  async read() {
    await storeDb.read();
  },

  async update(newData: Partial<VizStoreDbType>) {
    await storeDb.update((data) => {
      Object.assign(data, newData);
    });
  },

  get data() {
    return storeDb.data;
  },
  get settings() {
    return storeDb.data.settings;
  },

  get sourceId() {
    return this.settings.sourceId;
  },
  get source() {
    return sources[this.sourceId];
  },
};
