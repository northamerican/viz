<script setup lang="ts">
import { computed } from "vue";
import Accounts from "./Accounts.vue";
import Playlist from "./Playlist.vue";
import Playlists from "./Playlists.vue";
import Queues from "./Queues.vue";
import { store } from "../store";

const libraryView = computed(
  () => (isView: string) =>
    isView ===
    (store.view.playlist
      ? "playlist"
      : store.view.playlists
        ? "playlists"
        : "account")
);
</script>

<template>
  <section class="library">
    <Accounts v-show="libraryView('account')" />
    <Playlists
      v-show="libraryView('playlists')"
      :account="store.view.account"
    />
    <Playlist
      v-show="libraryView('playlist')"
      :playlist="store.view.playlist"
    />
    <div>
      <Queues />
    </div>
  </section>
</template>

<style scoped>
.library {
  display: flex;
  flex-direction: row;
  gap: 10px;

  > * {
    flex: 0 50%;
  }
}
</style>
