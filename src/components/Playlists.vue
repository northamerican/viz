<script setup lang="ts">
import ListItem from './ListItem.vue'
import { onMounted } from 'vue'
import { onLoadPlaylists, onLoadPlaylist } from '../server/playlists.telefunc'
import { store } from '../store'

const getPlaylists = async () => {
  const { playlists } = await onLoadPlaylists()
  store.playlists = playlists
}

const getPlaylist = async (playlistId: string) => {
  store.selectedPlaylist = null
  const { playlist } = await onLoadPlaylist(playlistId)
  store.selectedPlaylist = playlist
}

onMounted(() => getPlaylists())
</script>

<template>
  <div v-if="store.playlists.items?.length">
    <h1>Playlists [Spotify]</h1>
    <div v-for="playlist in store.playlists.items">
      <ListItem>
        <strong class="name" @click="getPlaylist(playlist.id)">{{
          playlist.name
        }}</strong>
        <div class="actions">
          <!-- <ActionsMenu></ActionsMenu> -->
        </div>
      </ListItem>
    </div>
  </div>
  <p v-else>Loading...</p>
</template>

<style>
.name {
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

.actions {
  margin-left: auto;
}
</style>
