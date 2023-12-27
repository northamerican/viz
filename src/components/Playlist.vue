<script setup lang="ts">
import type { Track } from 'Viz'
import ListItem from './ListItem.vue'
import ActionsMenu from './ActionsMenu.vue'
import { onAddToQueue } from '../server/playlist.telefunc'
import { store } from '../store'

// TODO playlist prop, don't use selectedPlaylist
const addToQueue = async (tracks: Track[]) => {
  const { id, name, player } = store.selectedPlaylist
  await onAddToQueue(
    store.queue?.id,
    tracks.map(track => {
      return { track, videoId: null }
    }),
    { id, name, player }
  )
  store.updateQueue()
}

const deselectPlaylist = () => {
  store.selectedPlaylist = null
}

const actionsMenuOptions = (track: Track) => [
  { action: () => addToQueue([track]), label: 'Add to Queue' }
]
</script>

<template>
  <div v-if="store.selectedPlaylist">
    <header>
      <h2>
        <button @click="deselectPlaylist">⇦</button>
        {{ store.selectedPlaylist.name }}
      </h2>
      <div>
        <button @click="() => addToQueue(store.selectedPlaylist.tracks)">
          +
        </button>
        <!-- Function to have queue follow updates to this playlist -->
        <!-- <button>Follow playlist</button> -->
      </div>
    </header>
    <ListItem v-for="track in store.selectedPlaylist.tracks">
      <div class="info">
        <strong>{{ track.name }}</strong>
        <br />
        <span class="track-artist" v-for="artist in track.artists">
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
