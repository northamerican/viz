import { JSONFilePreset } from "lowdb/node";
import { prefsDbPath } from "../consts";
import sources from "../sources";
import { SourceId } from "../../types/VizSource";

type VizPrefsDbType = {
  source: SourceId;
};

const prefsDbDefault = {
  source: "youtube",
} as const;

const prefsDb = await JSONFilePreset<VizPrefsDbType>(
  prefsDbPath,
  prefsDbDefault
);
await prefsDb.read();

export const PrefsDb = {
  get sourceName() {
    return prefsDb.data.source;
  },
  get source() {
    return sources[this.sourceName];
  },
};
