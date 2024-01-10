import playerApi from "../server/players";
import { PlayerId } from "../types/VizPlayer";

export async function onAuthorize(playerId: PlayerId) {
  return playerApi[playerId].authorize();
}

export async function onLogin({
  playerId,
  code,
}: {
  playerId: PlayerId;
  code: string;
}) {
  const player = new playerApi[playerId]();
  await player.login(code);
}
