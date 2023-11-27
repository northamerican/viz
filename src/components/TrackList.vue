<script setup lang="ts">
import axios from 'axios'
import { onMounted, onUnmounted } from 'vue'
import type { AppState, Track } from 'Viz'
import ListItem from './ListItem.vue'

const props = defineProps<{ state: AppState }>()

const getVideo = async ({ artists, title }: Partial<Track>) => {
  axios.post('/video', {
    artist: artists[0],
    title
  })
}

const playPlaylist = () => {
  axios.post('/api/play/')
}

const unselectPlaylist = () => {
  props.state.selectedPlaylist = null
}

let getTracklistInterval: NodeJS.Timeout
onMounted(async () => {
  //
  getTracklistInterval = setInterval(() => {
    //
  }, 5000)
})

onUnmounted(() => clearInterval(getTracklistInterval))
</script>

<template>
  <div v-if="state.selectedPlaylist">
    <header>
      <h2 class="title">
        <button @click="unselectPlaylist">⇦</button>
        {{ state.selectedPlaylist.name }}
      </h2>
      <button class="play" @click="playPlaylist">▶</button>
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
  margin-inline: 1rem;

  & .title {
    margin-top: 0;
  }
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
