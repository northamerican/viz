<script setup lang="ts">
import type { QueueItem } from 'Viz'
import ListItem from './ListItem.vue'
import ActionsMenu from './ActionsMenu.vue'
import { onMounted } from 'vue'
import {
  onGetVideo,
  onDownloadVideo,
  onDeleteQueues,
  onDeleteVideos,
  onRemoveQueueItem,
  onPlayVideo,
  onDownloadNextVideoInQueue,
  onUpdateQueueFromPlaylist,
  onUpdateQueueWithVideo
} from './Queue.telefunc'
import { store } from '../store'

const playQueue = async () => {
  await onPlayVideo()
  const { videoEl } = store
  videoEl.src = videoEl.src
  videoEl.fastSeek(0)
  videoEl.play()
}

const queueDownload = async () => {
  // TODO interval or on event
  // if has nextDownloadableInQueue:
  await onDownloadNextVideoInQueue()

  // and check again on completion, recursively
  store.updateQueue()
}

const downloadVideo = async (queueItem: QueueItem) => {
  const { videoId, url } = await onGetVideo(store.queue.id, queueItem)
  await store.updateQueue()
  await onDownloadVideo(videoId, url)
  await store.updateQueue()
}

const deleteQueueAndVideos = async () => {
  const { videoEl } = store
  await Promise.all([onDeleteQueues(), onDeleteVideos()])
  store.updateQueue()
  videoEl.src = videoEl.src
}

const removeItem = async (queueItem: QueueItem) => {
  await onRemoveQueueItem(store.queue.id, queueItem.id)
  store.updateQueue()
}

const actionsMenuOptions = (queueItem: QueueItem) => [
  {
    action: () => downloadVideo(queueItem),
    label: 'Get Video',
    disabled: queueItem.video?.downloaded
  },
  { action: () => removeItem(queueItem), label: 'Remove from Queue' },
  { action: () => {}, label: 'Replace Video...', disabled: true },
  {},
  {
    action: () => {
      window.open(queueItem.video.sourceUrl, '_blank')
    },
    // TODO label can read "[Video title] on Youtube...""
    label: 'Go to YouTube Video...',
    disabled: !queueItem.video?.sourceUrl
  },
  {
    action: () => {
      window.open(queueItem.track.playerUrl, '_blank')
    },
    label: 'Go to Spotify Song...'
  }
]

onMounted(() => {
  store.updateQueue()
  onUpdateQueueWithVideo()
  // onUpdateQueueFromPlaylist()
})
</script>

<template>
  <div v-if="store.queue">
    <header>
      <h2>Queue</h2>
      <div>
        <button @click="deleteQueueAndVideos">X</button>
        <button @click="queueDownload">⬇</button>
        <button @click="playQueue">▶</button>
      </div>
    </header>
    <ListItem v-for="item in store.queue.items" v-if="store.queue.items.length">
      <div class="track-info">
        <strong>{{ item.track.name }}</strong>
        <br />
        <span class="track-artist" v-for="artist in item.track.artists">
          {{ artist }}
        </span>
      </div>
      <div class="actions">
        {{ item.video?.downloading ? '⌛︎' : '' }}
        {{ item.video?.downloaded ? '✔' : '' }}
        <ActionsMenu :options="actionsMenuOptions(item)" />
      </div>
    </ListItem>
    <p v-else>Nothing queued.</p>
    <hr />
    <ListItem v-if="store.queue.playlist">
      <div>
        <strong>{{ store.queue.playlist.name }}</strong>
        <br />
        <span>on {{ store.queue.playlist.player }}</span>
      </div>
    </ListItem>
  </div>
</template>

<style>
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-inline: 0.5rem;
}

.track-info {
  .track-artist + .track-artist::before {
    content: ', ';
  }
}

.actions {
  margin-left: auto;
}
</style>
./queue.telefunc
