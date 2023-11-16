<script setup lang="ts">
import { reactive } from 'vue'
import Login from './components/Login.vue'
import { AppState } from './viz'
import TrackList from './components/TrackList.vue'

const state = reactive<AppState>({
  token: '',
  trackList: [],
  currentTrack: null
})
</script>

<template>
  <nav>viz <Login :state="state" /></nav>

  <!-- <video id="video" width="50%" src="./hls/viz.m3u8" controls muted autoplay /> -->

  <div class="card">
    <TrackList :state="state" />
  </div>
</template>

<style scoped>
/*  */
</style>
