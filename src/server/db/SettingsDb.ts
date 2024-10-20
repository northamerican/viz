import { settingsDbName } from "../consts";
import sources from "../sources";
import { VizSettingsDbType } from "../../types/VizStore";
import { VizEventPreset } from "./adapters/VizEventAdapter";

const settingsDbDefault: VizSettingsDbType = {
  // TODO view:
  settings: {
    sourceId: "youtube",
    downloadQueueItems: true,
    maxQuality: 720,
    receiverAspectRatio: 16 / 9,
    displayAspectRatio: 4 / 3,
  },
};

const settingsDb = await VizEventPreset<VizSettingsDbType>(
  settingsDbName,
  settingsDbDefault
);

export const SettingsDb = {
  async read() {
    await settingsDb.read();
  },

  async update(newData: Partial<VizSettingsDbType>) {
    await settingsDb.update((data) => {
      Object.assign(data, newData);
    });
  },

  get data() {
    return settingsDb.data;
  },
  get settings() {
    return settingsDb.data.settings;
  },
  get sourceId() {
    return this.settings.sourceId;
  },
  get source() {
    return sources[this.sourceId];
  },
  get aspectRatioCorrectionFactor() {
    const { receiverAspectRatio, displayAspectRatio } = SettingsDb.settings;
    return receiverAspectRatio / displayAspectRatio;
  },
};
