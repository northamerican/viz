import type {
  QueueItem,
  QueuePlaylistReference,
  VideoInfo,
  NewQueueItem,
  Queue,
} from "Viz";
import { VideosDb } from "../server/db/VideosDb";
import { StoreDb } from "../server/db/StoreDb";
import { QueuesDb } from "../server/db/QueuesDb";
import playerApi from "../server/players";
import { AccountsDb } from "../server/db/AccountsDb";
import type { PlayerId } from "../types/VizPlayer";
import { interstitalEveryTracksCount } from "../consts";

type GetVideoInfo = () => Promise<VideoInfo>;

export async function onGetVideo(queueItem: QueueItem) {
  const { track, id: queueItemId } = queueItem;
  const { artists, name, videoId: trackVideoId } = track;
  const artist = artists[0];

  try {
    const getVideoInfo: GetVideoInfo = trackVideoId
      ? async () => {
          console.log(`Getting video ${trackVideoId}`);
          return {
            videoId: queueItem.track.videoId,
            url: queueItem.track.playerUrl,
            // TODO thumb via getVideoInfo-like method
            thumbnail: null,
            alternateVideos: null,
          };
        }
      : async () => {
          console.log(`Getting video for ${name} - ${artist}`);
          const { createSearchQuery, getVideoInfo } = StoreDb.source;
          const searchQuery = createSearchQuery({ artist, name });
          const { videoId, url, thumbnail, alternateVideos } =
            await getVideoInfo(searchQuery);
          return { videoId, url, thumbnail, alternateVideos };
        };

    const { videoId, url, thumbnail, alternateVideos } = await getVideoInfo();

    await VideosDb.addVideo({
      id: videoId,
      source: StoreDb.sourceId,
      sourceUrl: url,
      thumbnail,
      alternateVideos,
    });
    await QueuesDb.editItem(queueItemId, { videoId });

    return { videoId, url };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.error(error);

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

export async function onRemovePlaylistReference(
  queueId: string,
  playlistId: string
) {
  await QueuesDb.removePlaylist(queueId, playlistId);
}

async function getNewTracks(
  queue: Queue,
  playlistReference: QueuePlaylistReference
) {
  const playlistAccountLoggedIn = AccountsDb.account(
    playlistReference.account.id
  )?.isLoggedIn;

  if (!playlistAccountLoggedIn) return;

  // Get playlist contents
  const { id, account } = playlistReference;
  const player = new playerApi[<PlayerId>account.player](account.id);
  const playlist = await player.getPlaylist(id);

  if (!playlist) return;

  // Only get tracks that are newly added to the playlist
  const queueItems = queue.items.filter(
    (item) => !item.removed && item.playlistId === playlistReference.id
  );
  const latestAddedAt = Math.max(
    ...queueItems.map((item) => item.track.addedAt)
  );
  // TODO handle generated playlists where all tracks have  addedAt: 0.
  const existingTrackIds = queue.items.map((item) => item.track.id);
  const newTracks = playlist.tracks.filter(
    (track) =>
      // Track added after the latest added track
      track.addedAt >= latestAddedAt &&
      // Is not already in the list
      !existingTrackIds.includes(track.id)
  );

  return newTracks;
}

export async function onUpdateQueueFromPlaylists(queueId: string) {
  // Tracks
  const queue = QueuesDb.getQueue(queueId);
  const { playlists } = queue;

  const trackPlaylists = playlists.filter(
    (playlist) => playlist.type === "track" && playlist.updatesQueue
  );
  const newTracks = await Promise.all(
    trackPlaylists.map((playlist) => getNewTracks(queue, playlist))
  );

  const newTrackQueueItems = newTracks
    .flatMap((playlist, playlistIndex) =>
      playlist.map(
        (track) =>
          ({
            track,
            videoId: null,
            removed: false,
            playlistId: trackPlaylists[playlistIndex].id,
            type: "track",
          }) as NewQueueItem
      )
    )
    .sort((item1, item2) => item1.track.addedAt - item2.track.addedAt);

  if (!newTrackQueueItems.length) return;

  // Interstitials
  const interstitialsPlaylists = playlists.filter(
    (playlist) => playlist.type === "interstitial" && playlist.updatesQueue
  );

  if (!interstitialsPlaylists.length)
    return QueuesDb.addItems(queueId, newTrackQueueItems);

  const newInterstitials = await Promise.all(
    trackPlaylists.map((playlist) => getNewTracks(queue, playlist))
  );

  if (!newInterstitials.length)
    return QueuesDb.addItems(queueId, newTrackQueueItems);

  const newInterstitialQueueItems = newInterstitials
    .flatMap((playlist, playlistIndex) =>
      playlist.map(
        (track) =>
          ({
            track,
            videoId: null,
            removed: false,
            playlistId: interstitialsPlaylists[playlistIndex].id,
            type: "interstitial",
          }) as NewQueueItem
      )
    )
    .sort((item1, item2) => item1.track.addedAt - item2.track.addedAt);

  // Insert interstitials between new tracks
  const lastInterstitialCount =
    queue.items.length -
    1 -
    queue.items.findLastIndex((item) => item.type === "interstitial");

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
