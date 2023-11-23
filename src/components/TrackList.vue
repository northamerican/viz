<script setup lang="ts">
import axios from 'axios'
import { onMounted, onUnmounted } from 'vue'
import type { AppState, Track, TrackList } from 'Viz'

const props = defineProps<{ state: AppState }>()

const getCurrent = async () => {
  const { data } = await axios.get<Track>('/current')
  props.state.currentTrack = data
  // if (status === 204) throw new Error("No track playing");
}

const getTrackList = async () => {
  const { data } = await axios.get<TrackList>('/queue')
  // if (status === 204) throw new Error("No tracks queued");
  props.state.trackList = data
}

const getVideo = async ({ artist, title }: Partial<Track>) => {
  axios.post('/video', {
    artist,
    title
  })
}

const isCurrentTrack = (track: Track) =>
  track.id === props.state.currentTrack.id

onMounted(async () => {
  getCurrent()
  getTrackList()
})

let getTracklistInterval: NodeJS.Timeout
onMounted(async () => {
  getCurrent()
  getTrackList()
  getTracklistInterval = setInterval(() => {
    getCurrent()
    getTrackList()
  }, 5000)
})

onUnmounted(() => clearInterval(getTracklistInterval))
</script>

<template>
  <div v-if="state.trackList.length">
    <!-- <Track /> -->
    <div v-for="track in state.trackList" class="track">
      <div class="track-play-state">
        <span v-if="isCurrentTrack(track)">
          <span v-if="state.currentTrack.isPlaying">▶</span>
          <span v-else>⏸</span>
        </span>
      </div>
      <div class="track-info">
        <strong>{{ track.title }}</strong>
        <br /><span>{{ track.artist }}</span>
      </div>
      <div class="track-actions">
        <button @click="() => getVideo(track)">get video</button>
      </div>
    </div>
  </div>
  <p v-else>Nothing playing.</p>
</template>

<style>
.track {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.track-play-state {
  width: 2rem;
  margin-right: 0;
}

.track-actions {
  margin-left: auto;
}
</style>
