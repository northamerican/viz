import { Account } from "Viz";
import playerApi from "../server/players";
import { PlayerId } from "../types/VizPlayer";

export async function onLogout(account: Account) {
  const player = new playerApi[<PlayerId>account.player](account.id);
  player.logout();
}
