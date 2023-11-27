<script setup lang="ts">
import { reactive } from 'vue'
import { getCookie } from 'typescript-cookie'

import Login from './components/Login.vue'
import Player from './components/Player.vue'
import TrackList from './components/TrackList.vue'
import Playlists from './components/Playlists.vue'

import type { AppState } from 'Viz'

const state = reactive<AppState>({
  isLoggedIn: !!getCookie('isLoggedIn'),
  trackList: [],
  currentTrack: null,
  playlists: [],
  selectedPlaylist: null
})
</script>

<template>
  <nav>
    <h1>viz</h1>
    <Login :state="state" />
  </nav>

  <main>
    <Player :state="state" />
    <section v-if="state.isLoggedIn" class="library">
      <Playlists :state="state" v-if="state.selectedPlaylist === null" />
      <TrackList :state="state" v-else />

      <div>
        <!-- <Queue /> -->
        <h1>Queue</h1>
      </div>
    </section>
    <section v-else>Log in to see your playlists</section>
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
