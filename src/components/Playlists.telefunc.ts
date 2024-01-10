import { Account } from "Viz";
import playerApi from "../server/players";

export async function onLoadPlaylists(account: Account) {
  const player = new playerApi[account.player](account.id);
  const playlists = await player.getPlaylists();
  return { playlists };
}

export async function onLoadPlaylist(account: Account, playlistId: string) {
  const player = new playerApi[account.player](account.id);
  const playlist = await player.getPlaylist(playlistId);
  return { playlist };
}
