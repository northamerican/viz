import { storeDbName } from "../consts";
import sources from "../sources";
import { VizStoreDbType } from "../../types/VizStore";
import { VizEventPreset } from "./adapters/VizEventAdapter";

const storeDbDefault: VizStoreDbType = {
  // TODO view:
  settings: {
    sourceId: "youtube",
    downloadQueueItems: true,
    maxQuality: 720,
    receiverAspectRatio: 16 / 9,
    displayAspectRatio: 4 / 3,
  },
};

const storeDb = await VizEventPreset<VizStoreDbType>(
  storeDbName,
  storeDbDefault
);

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
  get aspectRatioCorrectionFactor() {
    const { receiverAspectRatio, displayAspectRatio } = StoreDb.settings;
    return receiverAspectRatio / displayAspectRatio;
  },
};
