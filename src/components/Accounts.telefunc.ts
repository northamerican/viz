import playerApi from "../server/players";
import { PlayerId } from "../types/VizPlayer";

export async function onReadToken({
  playerId,
  code,
}: {
  playerId: PlayerId;
  code: string;
}) {
  try {
    const player = new playerApi[playerId]();
    await player.login(code);
  } catch (e) {
    console.error(e);
  }
}
