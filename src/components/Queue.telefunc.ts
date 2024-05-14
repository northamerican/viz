import type { QueueItem } from "Viz";
import { readdirSync, rmSync } from "fs";
import { VideosDb } from "../server/db/VideosDb";
import { StoreDb } from "../server/db/StoreDb";
import { QueuesDb } from "../server/db/QueuesDb";
import { hlsDir } from "../server/consts";
import playerApi from "../server/players";
import { PlayerId } from "../types/VizPlayer";
import { AccountsDb } from "../server/db/AccountsDb";

export async function onGetVideo(queueId: string, queueItem: QueueItem) {
  const { track, id: queueItemId } = queueItem;
  const { artists, name } = track;
  const artist = artists[0];

  console.log(`Getting video for ${name} - ${artist}`);
  const { createSearchQuery, getVideoUrl } = StoreDb.source;
  const searchQuery = createSearchQuery({ artist, name });
  const { videoId, url } = await getVideoUrl(searchQuery);

  // TODO handle no video found
  await VideosDb.addVideo({
    id: videoId,
    source: StoreDb.sourceId,
    sourceUrl: url,
    duration: 0,
    downloaded: false,
    downloading: true,
    segmentDurations: [],
  });
  await QueuesDb.editItem(queueId, queueItemId, { videoId });

  return { videoId, url };
}

export async function onDownloadVideo(videoId: string, url: string) {
  const { downloadVideo } = StoreDb.source;

  return await downloadVideo({ videoId, url });
}

export async function onDownloadNextVideoInQueue() {
  const queueId = QueuesDb.currentQueue.id;
  const queueItem = QueuesDb.nextDownloadableInQueue;

  if (!queueItem) return false;

  const { videoId, url } = await onGetVideo(queueId, queueItem);

  return await onDownloadVideo(videoId, url);
}

export async function onRemoveQueueItem(queueId: string, queueItemId: string) {
  await QueuesDb.removeItem(queueId, queueItemId);
}

export async function onDeleteVideos() {
  VideosDb.deleteDb();
  readdirSync(hlsDir).forEach((f) =>
    rmSync(`${hlsDir}/${f}`, { recursive: true })
  );
}

export async function onDeleteQueues() {
  await QueuesDb.deleteDb();
}

export async function onStartQueue() {
  await QueuesDb.setStartTime(Date.now());
}

export async function onUpdateQueueFromPlaylist() {
  const { playlists } = QueuesDb.currentQueue;
  const currentQueuePlaylist = playlists.find(
    (playlist) => playlist.updatesQueue
  );

  if (!currentQueuePlaylist) return;

  // Every account associated with playlist must be logged in
  const playlistsLoggedIn = QueuesDb.currentQueue.playlists.every(
    (playlist) => AccountsDb.account(playlist.account.id)?.isLoggedIn
  );

  console.log(
    QueuesDb.currentQueue.playlists.map(
      (playlist) => playlist.account.displayName
    )
  );
  console.log({ playlistsLoggedIn });

  if (!playlistsLoggedIn) return;

  const { id, account } = currentQueuePlaylist;
  const latestAddedAt = Math.max(
    ...QueuesDb.currentQueue.items.map((item) => item.track.addedAt)
  );
  const player = new playerApi[<PlayerId>account.player](account.id);
  const playlist = await player.getPlaylist(id);

  const newTracks = playlist.tracks.filter(
    (track) => track.addedAt > latestAddedAt
  );
  const newItems = newTracks.map((track) => {
    return { track, videoId: null, removed: false };
  });

  await QueuesDb.addItems(QueuesDb.currentQueue.id, newItems);
}
