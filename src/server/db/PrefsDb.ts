import { JSONPreset } from "lowdb/node";
import { prefsDbPath } from "../../consts";
import { VizPrefsDbType } from "Viz";
import players from "../players";
import sources from "../sources";

const prefsDbDefault = {
  player: "spotify",
  source: "youtube",
} as const

const prefsDb = await JSONPreset<VizPrefsDbType>(prefsDbPath, prefsDbDefault)

export const PrefsDb = {
  get player() {
    return players[prefsDb.data.player]
  },

  get source() {
    return sources[prefsDb.data.source]
  }
}