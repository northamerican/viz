<script setup lang="ts">
import axios from 'axios'
import type { AppState, Playlist, PlaylistList, PlaylistListItem } from 'Viz'
import ListItem from './ListItem.vue'
import { onMounted } from 'vue'
import { url } from '../consts'

const props = defineProps<{ state: AppState }>()

const getPlaylists = async () => {
  const { data } = await axios.get<PlaylistList>(url.api.playlists)
  props.state.playlists = data
  // if (status === 204) throw new Error("");
}

const getPlaylist = async (playlist: PlaylistListItem) => {
  const { id, total } = playlist
  props.state.selectedPlaylist = null
  const { data } = await axios.get<Playlist>(url.api.playlist(id), {
    params: {
      total
    }
  })
  props.state.selectedPlaylist = data
  // if (status === 204) throw new Error("");
}

onMounted(() => getPlaylists())
</script>

<template>
  <div v-if="state.playlists.items?.length">
    <h1>Playlists [Spotify]</h1>
    <div v-for="playlist in state.playlists.items">
      <ListItem>
        <strong class="name" @click="getPlaylist(playlist)">{{
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
