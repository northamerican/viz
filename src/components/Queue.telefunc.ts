import type {
  QueueItem,
  QueuePlaylistReference,
  VideoInfo,
  NewQueueItem,
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

async function getPlaylist(playlist: QueuePlaylistReference) {
  const playlistAccountLoggedIn = AccountsDb.account(
    playlist.account.id
  )?.isLoggedIn;

  if (!playlistAccountLoggedIn) return;

  // Get playlist contents
  const { id, account } = playlist;
  const player = new playerApi[<PlayerId>account.player](account.id);
  return player.getPlaylist(id);
}

// TODO allow specifying playlist
export async function onGetNewTracks(queueId: string) {
  const { items, playlists } = QueuesDb.getQueue(queueId);
  const playlistReference = playlists.find(
    (playlist) => playlist.type === "track" && playlist.updatesQueue
  );
  if (!playlistReference) return;

  const playlist = await getPlaylist(playlistReference);
  if (!playlist) return;

  // Only get tracks that are newly added to the playlist
  const queueItems = items.filter((item) => !item.removed);
  const queueTrackItems = queueItems.filter(
    (item) => item.playlistId === playlistReference.id
  );
  const latestAddedAt = Math.max(
    ...queueTrackItems.map((item) => item.track.addedAt)
  );
  const newTracks = playlist.tracks.filter(
    // TODO larger or equal && exclude any existing tracks
    // cause multiple tracks can be added at the same time
    // (track) => track.addedAt >= latestAddedAt
    (track) => track.addedAt > latestAddedAt
  );

  return newTracks;
}

export async function onUpdateQueueFromPlaylists(queueId: string) {
  const newTracks = await onGetNewTracks(queueId);

  if (!newTracks?.length) return;

  const { items, playlists } = QueuesDb.getQueue(queueId);
  const tracksPlaylistReference = playlists.find(
    (playlist) => playlist.type === "track" && playlist.updatesQueue
  );

  const newTrackQueueItems: NewQueueItem[] = newTracks.map((track) => ({
    track,
    videoId: null,
    removed: false,
    playlistId: tracksPlaylistReference.id,
    type: "track",
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

  // Get interstitials from playlist not already in queue
  const queueItems = items.filter((item) => !item.removed);
  const queueTrackIds = queueItems.map((item) => item.track.id);
  const newInterstitials = interstitialsPlaylist.tracks.filter(
    (track) => !queueTrackIds.includes(track.id)
  );

  if (!newInterstitials.length)
    return QueuesDb.addItems(queueId, newTrackQueueItems);

  const newInterstitialQueueItems: NewQueueItem[] = newInterstitials.map(
    (track) => ({
      track,
      videoId: null,
      removed: false,
      playlistId: interstitialsPlaylistReference.id,
      type: "interstitial",
    })
  );

  // Insert interstitials between new tracks
  const lastInterstitialCount =
    queueItems.length -
    1 -
    queueItems.findLastIndex((item) => item.type === "interstitial");

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
