<script setup lang="ts">
import { reactive, ref } from 'vue'
import { getCookie } from 'typescript-cookie'

import Login from './components/Login.vue'
import TrackList from './components/TrackList.vue'

import type { AppState } from './types/viz'
import { vizM3u8 } from './consts'

// import './hlsjs.ts'

const state = reactive<AppState>({
  isLoggedIn: !!getCookie('isLoggedIn'),
  trackList: [],
  currentTrack: null
})

const video = ref(null)
</script>

<template>
  <nav>
    <h1>viz</h1>
    <Login :state="state" />
  </nav>

  <main>
    <section class="video-content">
      <video
        id="video"
        ref="video"
        :src="`../hls/${vizM3u8}`"
        controls
        muted
        autoplay
      />
      <button @click="() => video.fastSeek(215)">skip</button>
    </section>

    <aside>
      <TrackList :state="state" v-if="state.isLoggedIn" />
    </aside>
  </main>
</template>

<style scoped>
nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 50px;

  & h1 {
    margin: 0;
  }
}
main {
  display: flex;
  gap: 1rem;
  flex: 1;
  overflow: auto;
  height: calc(100vh - 50px);
  padding: 1rem;
}
.video-content {
  flex-grow: 1;
}
video {
  width: 100%;
  height: auto;
}

aside {
  max-height: 100%;
  min-width: 500px;
  overflow-y: scroll;
}
</style>
