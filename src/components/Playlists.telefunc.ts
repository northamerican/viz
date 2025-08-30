import playerApi from "../server/players";
import { PlayerId } from "../types/VizPlayer";

export async function onLoadPlaylists(playerId: PlayerId, accountId: string) {
  const player = new playerApi[playerId](accountId);
  const playlists = await player.getPlaylists();
  return { playlists };
}

export async function onLoadPlaylist(
  playerId: PlayerId,
  accountId: string,
  playlistId: string
) {
  const player = new playerApi[playerId](accountId);
  const playlist = await player.getPlaylist(playlistId);
  return { playlist };
}
