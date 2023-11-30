<script setup lang="ts">
import { url } from '../consts'
// import '../hlsjs.ts'
import type { AppState } from 'Viz'

const props = defineProps<{ state: AppState }>()
</script>

<template>
  <section class="player">
    <video
      id="video"
      :ref="el => (props.state.videoEl = el)"
      :src="url.api.m3u"
      controls
      playsinline
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
