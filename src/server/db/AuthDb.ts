import { JSONPreset } from "lowdb/node";
import { authDbPath } from "../consts";
import { AuthState, AuthStateDbType } from "Viz";

const authDb = await JSONPreset<AuthStateDbType>(authDbPath, {})
await authDb.read()

export const AuthDb = {
  player(player: string) {
    return authDb.data[player]
  },

  editAuth(player: string, props: AuthState) {
    authDb.data[player] = props
    authDb.write()
  },

  clearAuth(player: string) {
    authDb.data[player] = {
      token: null
    }
    authDb.write()
  }
}