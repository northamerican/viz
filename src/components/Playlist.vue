<script setup lang="ts">
import type { Track } from 'Viz'
import ListItem from './ListItem.vue'
import ActionsMenu from './ActionsMenu.vue'
import { onAddToQueue } from './Playlist.telefunc'
import { store } from '../store'
import { Playlist } from 'Viz'

const props = defineProps<{ playlist: Playlist }>()

const addToQueue = async (tracks: Track[]) => {
  const { id, name, player } = props.playlist
  await onAddToQueue(
    store.queue?.id,
    tracks.map(track => {
      return { track, videoId: null, removed: false }
    }),
    { id, name, player }
  )
  store.updateQueue()
}

const deselectPlaylist = () => {
  store.playlists.selected = null
}

const actionsMenuOptions = (track: Track) => [
  { action: () => addToQueue([track]), label: 'Add to Queue' }
]
</script>

<template>
  <div v-if="props.playlist">
    <header>
      <h2>
        <button @click="deselectPlaylist">⇦</button>
        {{ props.playlist.name }}
      </h2>
      <div>
        <button @click="() => addToQueue(props.playlist.tracks)">+</button>
        <!-- Function to have queue follow updates to this playlist -->
        <!-- <button>Follow playlist</button> -->
      </div>
    </header>
    <ListItem v-for="track in props.playlist.tracks">
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
./playlist.telefunc
