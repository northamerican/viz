<script setup lang="ts">
import ListItem from "./ListItem.vue";
import { computed, watch } from "vue";
import { onLoadPlaylists, onLoadPlaylist } from "./Playlists.telefunc";
import { store } from "../store";
import { Account } from "Viz";

const props = defineProps<{ account: Account }>();

const getPlaylists = async () => {
  const { playlists } = await onLoadPlaylists(props.account);
  store.view.playlists = playlists;
};

const getPlaylist = async (playlistId: string) => {
  store.view.playlist = null;
  const { playlist } = await onLoadPlaylist(props.account, playlistId);
  store.view.playlist = playlist;
};

const deselectPlaylists = () => {
  store.view.account = null;
  store.view.playlists = null;
};

const playlists = computed(() => store.view.playlists);

watch(() => store.view.account, getPlaylists);
</script>

<template>
  <div v-if="playlists">
    <header>
      <h2>
        <button @click="deselectPlaylists">⇦</button>
        {{ store.view.account.displayName }} - playlists
      </h2>
    </header>
    <div v-for="playlist in playlists.items" :key="playlist.id">
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
/* TODO a (anchor) instead of strong? */
.name {
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}
</style>
