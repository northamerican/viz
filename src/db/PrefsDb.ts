import { JSONPreset } from "lowdb/node";
import { prefsDbPath } from "../consts";
import { VizPrefsDbType } from "Viz";
import players from "../players";
import sources from "../sources";

const prefsDbDefault = {
  player: "spotify",
  source: "youtube",
} as const

const prefsDb = await JSONPreset<VizPrefsDbType>(prefsDbPath, prefsDbDefault)
const { player, source } = prefsDb.data

export const PrefsDb = {
  get player() {
    return players[player]
  },

  get source() {
    return sources[source]
  }
}