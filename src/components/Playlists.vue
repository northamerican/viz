<script setup lang="ts">
import axios from 'axios'
import { onMounted, onUnmounted } from 'vue'
import type { AppState, Playlist, PlaylistList, PlaylistListItem } from 'Viz'
import ListItem from './ListItem.vue'

const props = defineProps<{ state: AppState }>()

const getPlaylists = async () => {
  const { data } = await axios.get<PlaylistList>('/api/playlists')
  props.state.playlists = data
  // if (status === 204) throw new Error("");
}

const getPlaylist = async (playlist: PlaylistListItem) => {
  const { id, total } = playlist
  props.state.selectedPlaylist = null
  const { data } = await axios.get<Playlist>(`/api/playlist/${id}`, {
    params: {
      total
    }
  })
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
    <h1>Playlists</h1>
    <div v-for="playlist in state.playlists.items">
      <ListItem>
        <strong class="playlist-title" @click="getPlaylist(playlist)">{{
          playlist.name
        }}</strong>
        <div class="playlist-actions">...</div>
      </ListItem>
    </div>
  </div>
  <p v-else>Loading...</p>
</template>

<style>
.playlist-title {
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

.playlist-actions {
  margin-left: auto;
}
</style>
