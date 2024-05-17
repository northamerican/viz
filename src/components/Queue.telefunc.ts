import type { QueueItem, TrackType } from "Viz";
import { readdirSync, rmSync } from "fs";
import { VideosDb } from "../server/db/VideosDb";
import { StoreDb } from "../server/db/StoreDb";
import { QueuesDb } from "../server/db/QueuesDb";
import { hlsDir } from "../server/consts";
import playerApi from "../server/players";
import { AccountsDb } from "../server/db/AccountsDb";
import type { PlayerId } from "../types/VizPlayer";

type GetVideoId = {
  [k in TrackType as string]: () => Promise<{
    videoId: string;
    url: string;
  }>;
};

export async function onGetVideo(queueId: string, queueItem: QueueItem) {
  const { track, id: queueItemId } = queueItem;
  const { artists, name, type } = track;
  const artist = artists[0];

  try {
    const getVideoId: GetVideoId = {
      track: async () => {
        console.log(`Getting video for ${name} - ${artist}`);
        const { createSearchQuery, getVideoUrl } = StoreDb.source;
        const searchQuery = createSearchQuery({ artist, name });
        const { videoId, url } = await getVideoUrl(searchQuery);
        return { videoId, url };
      },
      interstitial: async () => {
        console.log(`Getting video ${queueItem.track.videoId}`);
        return {
          videoId: queueItem.track.videoId,
          url: queueItem.track.playerUrl,
        };
      },
    };

    const { videoId, url } = await getVideoId[type]();

    await VideosDb.addVideo({
      id: videoId,
      source: StoreDb.sourceId,
      sourceUrl: url,
    });
    await QueuesDb.editItem(queueId, queueItemId, { videoId });

    return { videoId, url };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    await QueuesDb.editItem(queueId, queueItemId, {
      error,
    });

    return { videoId: null, url: null };
  }
}

export async function onDownloadVideo(videoId: string, url: string) {
  const { downloadVideo } = StoreDb.source;

  return await downloadVideo({ videoId, url });
}

export async function onGetNextDownloadableQueueItem() {
  const queueItem = QueuesDb.nextDownloadableInQueue;

  return queueItem;
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
