import type { Account } from "Viz";
import playerApi from "../server/players";
import { PlayerId } from "../types/VizPlayer";
import { AccountsDb } from "../server/db/AccountsDb";

export async function onAuthorize(playerId: PlayerId) {
  return playerApi[playerId].authorize();
}

export async function onLogout(account: Account) {
  AccountsDb.logout(account.id);
}

export async function onRemove(account: Account) {
  AccountsDb.remove(account.id);
}
