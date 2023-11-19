<script setup lang="ts">
import axios from 'axios'
import { onMounted, ref } from 'vue'
import { vizM3u8 } from '../consts'
import type { Videos } from '../types/viz.d.ts'
// import './hlsjs.ts'

const videoEl = ref(null)
const videos = ref(null)
const videoTimestamps = ref(null)

const getVideosDb = async () => {
  const { data } = await axios.get<{ videos: Videos }>('/db/videos.json')
  videos.value = data.videos
  videoTimestamps.value = data.videos.reduce(
    (videoTimestamps, { duration }) => {
      const lastTimestamp = (videoTimestamps.at(-1) || 0) + duration
      return videoTimestamps.concat(lastTimestamp)
    },
    []
  )
}

onMounted(async () => {
  getVideosDb()
})
</script>

<template>
  <video
    id="video"
    ref="videoEl"
    :src="`../hls/${vizM3u8}`"
    controls
    muted
    autoplay
  />
  <div>
    <!-- this will be queue, not videos.json  -->
    skip to
    <div v-for="(video, i) in videos">
      <button @click="() => videoEl.fastSeek(videoTimestamps[i])">
        {{ video.id }}
      </button>
    </div>
  </div>
</template>

<style scoped>
video {
  width: 100%;
  height: auto;
}
</style>
