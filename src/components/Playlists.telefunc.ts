import { Account } from "Viz";
import players from "../server/players";

export async function onLoadPlaylists(account: Account) {
  const player = new players[account.player].api(account.id);
  const playlists = await player.getPlaylists();
  return { playlists };
}

export async function onLoadPlaylist(account: Account, playlistId: string) {
  const player = new players[account.player].api(account.id);
  const playlist = await player.getPlaylist(playlistId);
  return { playlist };
}
