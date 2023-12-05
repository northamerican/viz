<script setup lang="ts">
import { reactive } from 'vue'
import { getCookie } from 'typescript-cookie'

import Login from './components/Login.vue'
import Player from './components/Player.vue'
import Playlist from './components/Playlist.vue'
import Playlists from './components/Playlists.vue'
import Queue from './components/Queue.vue'

import type { AppState } from 'Viz'

const state = reactive<AppState>({
  videoEl: null,
  isLoggedIn: !!getCookie('isLoggedIn'),
  playlists: {
    items: []
  },
  selectedPlaylist: null,
  queue: null
})
</script>

<template>
  <nav>
    <h1 class="logo"></h1>
    <Login :state="state" />
  </nav>

  <main>
    <Player :state="state" />
    <section class="library">
      <div v-if="state.isLoggedIn">
        <Playlists :state="state" v-if="state.selectedPlaylist === null" />
        <Playlist :state="state" v-else />
      </div>
      <div v-else>
        <p>Log in to see your playlists.</p>
      </div>
      <div>
        <Queue :state="state" />
      </div>
    </section>
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

.library {
  display: flex;
  flex-direction: row;

  & > * {
    flex: 0 50%;
  }
}
</style>
