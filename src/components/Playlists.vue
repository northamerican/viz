<script setup lang="ts">
import axios from 'axios'
import { onMounted, onUnmounted } from 'vue'
import type { AppState } from 'Viz'

const props = defineProps<{ state: AppState }>()

const getPlaylists = async () => {
  const { data } = await axios.get<any>('/api/playlists')
  props.state.playlists = data
  // if (status === 204) throw new Error("");
}

const getPlaylist = async (playlistId: string) => {
  props.state.selectedPlaylist = null
  const { data } = await axios.get<any>(`/api/playlist/${playlistId}`)
  props.state.selectedPlaylist = data
  // if (status === 204) throw new Error("");
}

onMounted(async () => {
  getPlaylists()
})

let getPlaylistsInterval: NodeJS.Timeout
onMounted(async () => {
  getPlaylists()
  getPlaylistsInterval = setInterval(() => {
    getPlaylists()
  }, 10000)
})

onUnmounted(() => clearInterval(getPlaylistsInterval))
</script>

<template>
  <div v-if="state.playlists.items?.length">
    <div v-for="playlist in state.playlists.items" class="playlist">
      <div>
        <button @click="getPlaylist(playlist.id)">{{ playlist.name }}</button>
      </div>
      <div class="playlist-actions">...</div>
    </div>
  </div>
  <p v-else>Loading...</p>
</template>

<style>
.playlist {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.playlist-actions {
  margin-left: auto;
}
</style>
