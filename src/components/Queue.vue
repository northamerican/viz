<script setup lang="ts">
import axios from 'axios'
import type { AppState, QueueItem } from 'Viz'
import ListItem from './ListItem.vue'
import ActionsMenu from './ActionsMenu.vue'
import { Queue } from 'Viz'
import { mountWithInterval } from '../helpers'
import { endpoints } from '../consts'

const props = defineProps<{ state: AppState }>()

const getVideo = async (item: QueueItem) => {
  const { track, id: queueItemId } = item
  const { artists, title } = track
  await axios.post(endpoints.api.video, {
    queueId: props.state.queue.id,
    queueItemId,
    artist: artists[0],
    title
  })
  getQueue()
}

const getQueue = async () => {
  const { data } = await axios.get<Queue>(endpoints.api.current)
  props.state.queue = data
}

const playQueue = () => {
  axios.post(endpoints.api.play)
  // TODO fastSeek video el to 0
}

const actionsMenuOptions = (item: QueueItem) => [
  {
    action: () => getVideo(item),
    label: 'Get Video',
    disabled: item.video?.downloaded
  },
  { action: () => {}, label: 'Replace Video...', disabled: true },
  { action: () => {}, label: 'Remove from Queue', disabled: true },
  {},
  {
    action: () => {
      window.open(item.video.sourceUrl, '_blank')
    },
    // TODO label can read "[Video title] on Youtube...""
    label: 'Go to YouTube Video...',
    disabled: !item.video?.sourceUrl
  },
  { action: () => {}, label: 'Go to Spotify Song...', disabled: true }
]

mountWithInterval(getQueue, 5000)
</script>

<template>
  <div v-if="state.queue?.items.length">
    <header>
      <h2 class="title">
        <!-- <button @click="">⇦</button> -->
        Queue
      </h2>
      <div>
        <button @click="playQueue">▶</button>
      </div>
    </header>
    <ListItem v-for="item in state.queue.items">
      <div class="track-info">
        <strong>{{ item.track.title }}</strong>
        <br />
        <span class="track-artist" v-for="artist in item.track.artists">
          {{ artist }}
        </span>
      </div>
      <div class="track-actions">
        {{ item.video?.downloading ? '⌛︎' : '' }}
        {{ item.video?.downloaded ? '✔' : '' }}
        <ActionsMenu :options="actionsMenuOptions(item)" />
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

.track-actions {
  margin-left: auto;
}
</style>
