<script setup lang="ts">
import axios from 'axios'
import { onMounted } from 'vue'
import { AppState, Track, TrackList } from '../viz'

const { state } = defineProps<{ state: AppState }>()

const getCurrent = async () => {
  const { data } = await axios.get<Track>('/current')
  state.currentTrack = data
  // if (status === 204) throw new Error("No track playing");
}

const getTrackList = async () => {
  const { data } = await axios.get<TrackList>('/queue')
  // if (status === 204) throw new Error("No tracks queued");
  state.trackList = data
}

const getVideo = async ({ artist, title }: Partial<Track>) => {
  axios.post('/video', {
    artist,
    title
  })
}

const isCurrentTrack = (track: Track) => track.id === state.currentTrack.id

onMounted(async () => {
  getCurrent()
  getTrackList()
})
</script>

<template>
  <div v-if="state.trackList.length">
    <p v-for="track in state.trackList">
      <strong>{{ track.title }}</strong>
      <br /><span>{{ track.artist }}</span>
      <span v-if="isCurrentTrack(track)">
        <span v-if="state.currentTrack.is_playing"> ▶ </span>
        <span v-else>⏸</span>
      </span>
      <!-- <span v-else>⏸</span> -->
      <button @click="() => getVideo(track)">get video</button>
    </p>
  </div>
  <div v-else>Nothing playing or queued.</div>
</template>
