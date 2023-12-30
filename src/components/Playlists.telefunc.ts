import { PrefsDb } from "../server/db/PrefsDb";

export async function onLoadPlaylists() {
  const playlists = await PrefsDb.player.getPlaylists();
  return { playlists };
}

export async function onLoadPlaylist(playlistId: string) {
  const playlist = await PrefsDb.player.getPlaylist(playlistId);
  return { playlist };
}
