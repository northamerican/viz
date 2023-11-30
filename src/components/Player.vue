<script setup lang="ts">
import { ref } from 'vue'
import { url } from '../consts'
// import '../hlsjs.ts'

const videoEl = ref(null)
</script>

<template>
  <section class="player">
    <video id="video" ref="videoEl" :src="url.api.m3u" controls autoplay />
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
