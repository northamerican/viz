<script setup lang="ts">
import axios from 'axios'
import { onMounted, onUnmounted, ref } from 'vue'
import type { AppState, QueueDbType, Track } from 'Viz'
import ListItem from './ListItem.vue'
import ActionsMenu from './ActionsMenu.vue'

const props = defineProps<{ state: AppState }>()

const actionsMenu = ref(0)

const getVideo = async ({ artists, title }: Partial<Track>) => {
  axios.post('/video', {
    artist: artists[0],
    title
  })
}

const getQueue = async () => {
  const { data } = await axios.get<QueueDbType>('/api/queue')
  props.state.queue = data.queues[0]
  // if (status === 204) throw new Error("");
}

const playQueue = () => {
  axios.post('/api/play/')
}

const openActions = () => {
  console.log(actionsMenu)
  // actionsMenu.click()
}

// let getQueueInterval: NodeJS.Timeout
onMounted(async () => {
  getQueue()
  // getQueueInterval = setInterval(() => {
  //   getQueue();
  // }, 5000)
})

// onUnmounted(() => clearInterval(getQueueInterval))
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
      <div class="track-info" @contextmenu="openActions">
        <strong>{{ item.track.title }}</strong>
        <br /><span class="track-artist" v-for="artist in item.track.artists">
          {{ artist }}
        </span>
      </div>
      <div class="track-actions">
        {{ item.downloaded ? '✔' : '⌛︎ ' }}
        <ActionsMenu>
          <!-- <option disabled value>Actions</option> -->
          <option value="remove">Replace Video...</option>
          <option value="remove">Remove from Queue</option>
          <hr />
          <option value="goToSource">Go to YouTube Video...</option>
          <option value="goToPlayer">Go to Spotify Song...</option>
        </ActionsMenu>
      </div>
    </ListItem>
  </div>
  <!-- <p v-else>Nothing playing.</p> -->
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
