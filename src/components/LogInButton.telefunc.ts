import players from "../players";
import { PlayerIds } from "../types/VizPlayer";

export async function onAuthorize(playerId: PlayerIds) {
  return players[playerId].api.authorize();
}

export async function onLogin({
  playerId,
  code,
}: {
  playerId: PlayerIds;
  code: string;
}) {
  const player = new players[playerId].api();
  await player.login(code);
}
