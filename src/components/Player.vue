<script setup lang="ts">
import axios from 'axios'
import { onMounted, onUnmounted, ref } from 'vue'
import { vizM3u8 } from '../consts'
import type { Videos } from 'Viz'
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
    [0]
  )
}

let getVideosDbInterval: NodeJS.Timeout
onMounted(async () => {
  getVideosDb()
  getVideosDbInterval = setInterval(() => {
    getVideosDb()
  }, 5000)
})

onUnmounted(() => clearInterval(getVideosDbInterval))
</script>

<template>
  <section class="player">
    <video
      id="video"
      ref="videoEl"
      :src="`/api/hls/${vizM3u8}`"
      controls
      muted
      autoplay
    />
  </section>
</template>

<style scoped>
.player {
  flex-grow: 1;
  text-align: center;
}

video {
  width: auto;
  max-height: 80vh;
}
</style>
