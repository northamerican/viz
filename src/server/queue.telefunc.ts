import { QueueItem } from "Viz";
import { readdirSync, rmSync } from "fs";
import { VideosDb } from "./db/VideosDb";
import { PrefsDb } from "./db/PrefsDb";
import { QueuesDb } from "./db/QueuesDb";
import { hlsDir } from "./consts";

export async function onGetVideo(queueId: string, queueItem: QueueItem) {
  const { track, id: queueItemId } = queueItem
  const { artists, name } = track
  const artist = artists[0]

  console.log(`Getting video for ${name} - ${artist}`)
  const { createSearchQuery, getVideoUrl } = PrefsDb.source;
  const searchQuery = createSearchQuery({ artist, name });
  const { videoId, url } = await getVideoUrl(searchQuery);

  // TODO handle no video found 
  await VideosDb.addVideo({
    id: videoId,
    source: PrefsDb.sourceName,
    sourceUrl: url,
    duration: 0,
    downloaded: false,
    downloading: true,
    segmentDurations: []
  })
  await QueuesDb.editItem(queueId, queueItemId, { videoId })

  return { videoId, url }
}

export async function onDownloadVideo(videoId: string, url: string) {
  const { downloadVideo } = PrefsDb.source;

  await downloadVideo({ videoId, url })
  return { videoId }
}

export async function onDownloadNextVideoInQueue() {
  const queueId = QueuesDb.currentQueue.id
  const queueItem = QueuesDb.nextDownloadableInQueue
  const { videoId, url } = await onGetVideo(queueId, queueItem)

  return await onDownloadVideo(videoId, url)
}

export async function onRemoveQueueItem(queueId: string, queueItemId: string) {
  await QueuesDb.removeItem(queueId, queueItemId)
}

export async function onDeleteVideos() {
  await VideosDb.deleteDb()
  readdirSync(hlsDir).forEach(f => rmSync(`${hlsDir}/${f}`, { recursive: true }));
}

export async function onDeleteQueues() {
  await QueuesDb.deleteDb()
}

export async function onPlayVideo() {
  await QueuesDb.setStartTime(Date.now())
}

export async function onUpdateQueueFromPlaylist() {
  const latestAddedAt = Math.max(...QueuesDb.currentQueue.items.map(item => item.track.addedAt))
  const playlist = await PrefsDb.player.getPlaylist(
    QueuesDb.currentQueue.playlist.id
  );

  const newTracks = playlist.tracks.filter(track => track.addedAt > latestAddedAt)
  const newItems = newTracks.map(track => {
    return { track, videoId: null }
  })

  await QueuesDb.addItems(QueuesDb.currentQueue.id, newItems)
}

export async function onUpdateQueueWithVideo() {
  await QueuesDb.read()
  return QueuesDb.currentQueueWithVideos
}
