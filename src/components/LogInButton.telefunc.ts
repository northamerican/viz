import playerApi from "../server/players";
import { PlayerId } from "../types/VizPlayer";

export async function onAuthorize(playerId: PlayerId) {
  return playerApi[playerId].authorize();
}
