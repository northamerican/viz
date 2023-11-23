<script setup lang="ts">
import { reactive } from 'vue'
import { getCookie } from 'typescript-cookie'

import Login from './components/Login.vue'
import Player from './components/Player.vue'
import TrackList from './components/TrackList.vue'

import type { AppState } from 'Viz'

const state = reactive<AppState>({
  isLoggedIn: !!getCookie('isLoggedIn'),
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
    <Player :state="state" />

    <aside>
      <TrackList :state="state" v-if="state.isLoggedIn" />
      <p v-else>Log in to see your playlist</p>
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

aside {
  max-height: 100%;
  min-width: 500px;
  overflow-y: scroll;
}
</style>
