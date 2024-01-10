import { JSONFilePreset } from "lowdb/node";
import { storeDbPath } from "../consts";
import sources from "../sources";
import { PersistedVizStore, VizStore } from "../../types/VizStore";

type VizStoreDbType = Pick<VizStore, "sourceId" | "isPlaying">;

const storeDbDefault: VizStoreDbType = {
  sourceId: "youtube",
  isPlaying: false,
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

  async update(newData: Partial<PersistedVizStore>) {
    await storeDb.update((data) => {
      Object.assign(data, newData);
    });
  },

  get data() {
    return storeDb.data;
  },

  get sourceId() {
    return storeDb.data.sourceId;
  },
  get source() {
    return sources[this.sourceId];
  },
};
