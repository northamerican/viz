<script setup lang="ts">
import axios from 'axios'
import { onMounted, onUnmounted } from 'vue'
import type { AppState, Playlist, Track } from 'Viz'
import ListItem from './ListItem.vue'

const props = defineProps<{ state: AppState }>()

const getVideo = async ({ artists, title }: Partial<Track>) => {
  axios.post('/video', {
    artist: artists[0],
    title
  })
}

const addToQueue = (playlist: Playlist) => {
  const { tracks } = playlist
  axios.post('/api/queue', {
    items: tracks.map(track => {
      return { track: track, videoId: null, downloaded: false }
    })
  })
}

const playPlaylist = () => {
  axios.post('/api/play/')
}

const unselectPlaylist = () => {
  props.state.selectedPlaylist = null
}

let getPlaylistInterval: NodeJS.Timeout
onMounted(async () => {
  //
  getPlaylistInterval = setInterval(() => {
    //
  }, 5000)
})

onUnmounted(() => clearInterval(getPlaylistInterval))
</script>

<template>
  <div v-if="state.selectedPlaylist">
    <header>
      <h2 class="title">
        <button @click="unselectPlaylist">⇦</button>
        {{ state.selectedPlaylist.name }}
      </h2>
      <div>
        <button @click="() => addToQueue(state.selectedPlaylist)">+</button>
        <button @click="playPlaylist">▶</button>
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
        <button @click="() => getVideo(track)">get video</button>
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
