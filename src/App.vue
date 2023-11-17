<script setup lang="ts">
import { reactive } from 'vue'
import Login from './components/Login.vue'
import TrackList from './components/TrackList.vue'

import type { AppState } from './types/viz'
import { vizM3u8 } from './consts'

const state = reactive<AppState>({
  token: '',
  trackList: [],
  currentTrack: null
})
</script>

<template>
  <nav>
    <h1>viz</h1>
    <Login :state="state" />
  </nav>

  <main>
    <video id="video" :src="`../hls/${vizM3u8}`" controls muted autoplay />

    <aside>
      <TrackList :state="state" />
    </aside>
  </main>
</template>

<style scoped>
nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  & h1 {
    margin: 0;
  }
}
main {
  display: flex;
  gap: 1rem;
}
video {
  height: 500px;
}
</style>
