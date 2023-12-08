<script setup lang="ts">
import axios from 'axios'
import type { AppState, QueueItem } from 'Viz'
import ListItem from './ListItem.vue'
import ActionsMenu from './ActionsMenu.vue'
import { url } from '../consts'
import { onBeforeUnmount, onMounted } from 'vue'

const props = defineProps<{ state: AppState }>()

const getVideo = async (item: QueueItem) => {
  const { track, id: queueItemId } = item
  const { artists, name } = track

  await axios.post(url.api.video, {
    queueId: props.state.queue.id,
    queueItemId,
    artist: artists[0],
    name
  })
}

const getQueue = async () => {
  const currentQueueSource = new EventSource(url.api.current)

  currentQueueSource.addEventListener('update', ({ data }) => {
    props.state.queue = JSON.parse(data)
  })

  onBeforeUnmount(() => {
    currentQueueSource.close()
  })
}

const playQueue = () => {
  axios.post(url.api.play)
  const { videoEl } = props.state
  videoEl.src = videoEl.src
  videoEl.fastSeek(0)
  videoEl.play()
}

const queueDownload = () => {
  axios.post(url.api.queueDownload)
}

const deleteQueueAndVideos = () => {
  axios.delete(url.api.videos)
  axios.delete(url.api.queues)
}

const remove = (item: QueueItem) => {
  axios.delete(url.api.queueItem(props.state.queue.id, item.id))
}

const actionsMenuOptions = (item: QueueItem) => [
  {
    action: () => getVideo(item),
    label: 'Get Video',
    disabled: item.video?.downloaded
  },
  { action: () => {}, label: 'Replace Video...', disabled: true },
  { action: () => remove(item), label: 'Remove from Queue' },
  {},
  {
    action: () => {
      window.open(item.video.sourceUrl, '_blank')
    },
    // TODO label can read "[Video title] on Youtube...""
    label: 'Go to YouTube Video...',
    disabled: !item.video?.sourceUrl
  },
  {
    action: () => {
      window.open(item.track.playerUrl, '_blank')
    },
    label: 'Go to Spotify Song...'
  }
]

onMounted(() => {
  getQueue()
})
</script>

<template>
  <div v-if="state.queue?.items.length">
    <header>
      <h2>Queue</h2>
      <div>
        <button @click="deleteQueueAndVideos">X</button>
        <button @click="queueDownload">⬇</button>
        <button @click="playQueue">▶</button>
      </div>
    </header>
    <ListItem v-for="item in state.queue.items">
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
    <hr />
    <ListItem>
      <div>
        <strong>{{ state.queue.playlist.name }}</strong>
        <br />
        <span>on {{ state.queue.playlist.player }}</span>
      </div>
    </ListItem>
  </div>
  <p v-else>Nothing queued.</p>
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
