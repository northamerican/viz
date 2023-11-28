<script setup lang="ts">
import { ref } from 'vue'
import { vizM3u8 } from '../consts'
// import '../hlsjs.ts'

const videoEl = ref(null)
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
