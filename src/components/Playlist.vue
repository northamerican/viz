<script setup lang="ts">
import axios from 'axios'
import type { AppState, Track } from 'Viz'
import ListItem from './ListItem.vue'
import ActionsMenu from './ActionsMenu.vue'
import { endpoints } from '../consts'

const props = defineProps<{ state: AppState }>()

const addToQueue = (tracks: Track[]) => {
  axios.post(endpoints.api.queue, {
    items: tracks.map(track => {
      return { track, videoId: null }
    })
  })
  // TODO make browser get current queue
}

const unselectPlaylist = () => {
  props.state.selectedPlaylist = null
}

const actionsMenuOptions = (track: Track) => [
  { action: () => addToQueue([track]), label: 'Add to Queue' }
]
</script>

<template>
  <div v-if="state.selectedPlaylist">
    <header>
      <h2 class="title">
        <button @click="unselectPlaylist">⇦</button>
        {{ state.selectedPlaylist.name }}
      </h2>
      <div>
        <button @click="() => addToQueue(state.selectedPlaylist.tracks)">
          +
        </button>
      </div>
    </header>
    <ListItem v-for="track in state.selectedPlaylist.tracks">
      <div class="track-info">
        <strong>{{ track.title }}</strong>
        <br /><span class="track-artist" v-for="artist in track.artists">
          {{ artist }}
        </span>
      </div>
      <div class="track-actions">
        <ActionsMenu :options="actionsMenuOptions(track)" />
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

.track-actions {
  margin-left: auto;
}
</style>
