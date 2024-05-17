import type { Account } from "Viz";
import playerApi from "../server/players";
import { PlayerId } from "../types/VizPlayer";

export async function onAuthorize(playerId: PlayerId) {
  return playerApi[playerId].authorize();
}

export async function onLogout(account: Account) {
  const player = new playerApi[<PlayerId>account.player](account.id);
  await player.logout();
}

export async function onRemove(account: Account) {
  const player = new playerApi[<PlayerId>account.player](account.id);
  await player.remove();
}
