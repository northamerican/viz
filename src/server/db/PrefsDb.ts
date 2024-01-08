import { JSONFilePreset } from "lowdb/node";
import { prefsDbPath } from "../consts";
import { SourceNames } from "Viz";
import sources from "../sources";

type VizPrefsDbType = {
  source: SourceNames;
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
