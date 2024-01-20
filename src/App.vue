<script setup lang="ts">
import { computed } from "vue";
import Accounts from "./components/Accounts.vue";
import VideoPlayer from "./components/VideoPlayer.vue";
import Playlist from "./components/Playlist.vue";
import Playlists from "./components/Playlists.vue";
import Queue from "./components/Queue.vue";
import { store } from "./store";

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
  <div>
    <nav>
      <h1 class="logo"></h1>
    </nav>

    <main>
      <VideoPlayer />
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
          <Queue />
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 50px;

  h1 {
    margin: 0;
  }
}

.library {
  display: flex;
  flex-direction: row;
  gap: 10px;

  > * {
    flex: 0 50%;
  }
}
</style>
