import { JSONFilePreset } from "lowdb/node";
import { prefsDbPath } from "../consts";
import { VizPrefsDbType } from "Viz";
import players from "../players";
import sources from "../sources";

const prefsDbDefault = {
  player: "spotify",
  source: "youtube",
} as const;

const prefsDb = await JSONFilePreset<VizPrefsDbType>(
  prefsDbPath,
  prefsDbDefault,
);
await prefsDb.read();

export const PrefsDb = {
  get playerName() {
    return prefsDb.data.player;
  },
  get sourceName() {
    return prefsDb.data.source;
  },

  get player() {
    return players[this.playerName];
  },
  get source() {
    return sources[this.sourceName];
  },
};
