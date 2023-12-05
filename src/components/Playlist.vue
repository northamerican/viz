<script setup lang="ts">
import axios from 'axios'
import type { AppState, Track } from 'Viz'
import ListItem from './ListItem.vue'
import ActionsMenu from './ActionsMenu.vue'
import { url } from '../consts'

const props = defineProps<{ state: AppState }>()

const addToQueue = (tracks: Track[]) => {
  axios.post(url.api.queueId(props.state.queue.id), {
    items: tracks.map(track => {
      return { track, videoId: null }
    }),
    player: props.state.selectedPlaylist.player,
    playlistId: props.state.selectedPlaylist.id
  })
}

const deselectPlaylist = () => {
  props.state.selectedPlaylist = null
}

const actionsMenuOptions = (track: Track) => [
  { action: () => addToQueue([track]), label: 'Add to Queue' }
]
</script>

<template>
  <div v-if="state.selectedPlaylist">
    <header>
      <h2>
        <button @click="deselectPlaylist">⇦</button>
        {{ state.selectedPlaylist.name }}
      </h2>
      <div>
        <button @click="() => addToQueue(state.selectedPlaylist.tracks)">
          +
        </button>
        <!-- Function to have queue follow updates to this playlist -->
        <!-- <button>Follow playlist</button> -->
      </div>
    </header>
    <ListItem v-for="track in state.selectedPlaylist.tracks">
      <div class="info">
        <strong>{{ track.name }}</strong>
        <br /><span class="track-artist" v-for="artist in track.artists">
          {{ artist }}
        </span>
      </div>
      <div class="actions">
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

.info {
  .track-artist + .track-artist::before {
    content: ', ';
  }
}

.actions {
  margin-left: auto;
}
</style>
