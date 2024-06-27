import type { QueueItem, QueuePlaylistReference, TrackType } from "Viz";
import { VideosDb } from "../server/db/VideosDb";
import { StoreDb } from "../server/db/StoreDb";
import { QueuesDb } from "../server/db/QueuesDb";
import playerApi from "../server/players";
import { AccountsDb } from "../server/db/AccountsDb";
import type { PlayerId } from "../types/VizPlayer";
import { interstitalEveryTracksCount } from "../consts";

type GetVideoId = {
  [k in TrackType as string]: () => Promise<{
    videoId: string;
    url: string;
    alternateVideos: string[];
  }>;
};

export async function onGetVideo(queueItem: QueueItem) {
  const { track, id: queueItemId } = queueItem;
  const { artists, name, type } = track;
  const artist = artists[0];

  try {
    const getVideoId: GetVideoId = {
      track: async () => {
        console.log(`Getting video for ${name} - ${artist}`);
        const { createSearchQuery, getVideoUrl } = StoreDb.source;
        const searchQuery = createSearchQuery({ artist, name });
        const { videoId, url, alternateVideos } =
          await getVideoUrl(searchQuery);
        return { videoId, url, alternateVideos };
      },
      interstitial: async () => {
        console.log(`Getting video ${queueItem.track.videoId}`);
        return {
          videoId: queueItem.track.videoId,
          url: queueItem.track.playerUrl,
          alternateVideos: null,
        };
      },
    };

    const { videoId, url, alternateVideos } = await getVideoId[type]();

    await VideosDb.addVideo({
      id: videoId,
      source: StoreDb.sourceId,
      sourceUrl: url,
      alternateVideos,
    });
    await QueuesDb.editItem(queueItemId, { videoId });

    return { videoId, url };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    await QueuesDb.editItem(queueItemId, {
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

export async function onRemoveQueueItem(queueItemId: string) {
  await QueuesDb.removeItem(queueItemId);
}

export async function onClearQueue(queueId: string) {
  await QueuesDb.clearQueue(queueId);
}

export async function onPlayQueue(queueId: string) {
  await QueuesDb.playQueue(queueId);
}

export async function onUpdatePlaylistReference(
  queueId: string,
  playlistId: string,
  props: Pick<QueuePlaylistReference, "updatesQueue">
) {
  await QueuesDb.editPlaylist(queueId, playlistId, props);
}

async function getPlaylist(playlist: QueuePlaylistReference) {
  const playlistAccountLoggedIn = AccountsDb.account(playlist.account.id)
    ?.isLoggedIn;

  if (!playlistAccountLoggedIn) return;

  // Get playlist contents
  const { id, account } = playlist;
  const player = new playerApi[<PlayerId>account.player](account.id);
  return player.getPlaylist(id);
}

export async function onUpdateQueueFromPlaylist(queueId: string) {
  const { items, playlists } = QueuesDb.getQueue(queueId);
  const queueItems = items.filter((item) => !item.removed);
  const tracksPlaylistReference = playlists.find(
    (playlist) => playlist.type === "track" && playlist.updatesQueue
  );

  if (!tracksPlaylistReference) return;

  const tracksPlaylist = await getPlaylist(tracksPlaylistReference);

  if (!tracksPlaylist) return;

  // Only add tracks that are newly added to the playlist
  // TODO could also check if the tracks originate from the same playlist
  const queueTrackItems = queueItems.filter(
    (item) => item.track.type === "track"
  );
  const latestAddedAt = Math.max(
    ...queueTrackItems.map((item) => item.track.addedAt)
  );
  const newTracks = tracksPlaylist.tracks.filter(
    (track) => track.addedAt > latestAddedAt
  );

  if (!newTracks.length) return;

  const newTrackQueueItems = newTracks.map((track) => ({
    track,
    videoId: null,
    removed: false,
  }));

  // Include interstitials
  const interstitialsPlaylistReference = playlists.find(
    (playlist) => playlist.type === "interstitial" && playlist.updatesQueue
  );

  if (!interstitialsPlaylistReference)
    return QueuesDb.addItems(queueId, newTrackQueueItems);

  const interstitialsPlaylist = await getPlaylist(
    interstitialsPlaylistReference
  );

  if (!interstitialsPlaylist)
    return QueuesDb.addItems(queueId, newTrackQueueItems);

  // Get random interstitials from playlist not already in queue
  const queueTrackIds = queueItems.map((item) => item.track.id);
  const newInterstitials = interstitialsPlaylist.tracks.filter(
    (track) => !queueTrackIds.includes(track.id)
  );

  if (!newInterstitials.length)
    return QueuesDb.addItems(queueId, newTrackQueueItems);

  const newInterstitialQueueItems = newInterstitials.map((track) => ({
    track,
    videoId: null,
    removed: false,
  }));

  // Insert interstitials between new tracks
  const lastInterstitialCount =
    queueItems.length -
    1 -
    queueItems.findLastIndex((item) => item.track.type === "interstitial");

  const shouldPrependInterstitial =
    lastInterstitialCount >= interstitalEveryTracksCount;

  const newQueueItems = [];
  // Insert interstitial at the beginning if the queue is due for one
  if (shouldPrependInterstitial) {
    newQueueItems.push(newInterstitialQueueItems.shift());
  }

  newQueueItems.push(
    ...newTrackQueueItems.flatMap((newTrackQueueItem, i) => {
      const hasAvailableInterstitial = newInterstitialQueueItems.length;
      const shouldInsertInterstitial =
        (i + 1) % interstitalEveryTracksCount === 0;

      return hasAvailableInterstitial && shouldInsertInterstitial
        ? [newTrackQueueItem, newInterstitialQueueItems.shift()]
        : newTrackQueueItem;
    })
  );

  await QueuesDb.addItems(queueId, newQueueItems);
}
