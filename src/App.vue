<script setup lang="ts">
import Auth from "./components/Auth.vue";
import Player from "./components/Player.vue";
import Playlist from "./components/Playlist.vue";
import Playlists from "./components/Playlists.vue";
import Queue from "./components/Queue.vue";
import { store } from "./store";
</script>

<template>
  <div>
    <nav>
      <h1 class="logo"></h1>
      <Auth />
    </nav>

    <main>
      <Player />
      <section class="library">
        <div v-if="store.isLoggedIn">
          <Playlists v-if="store.playlists.selected === null" />
          <Playlist v-else :playlist="store.playlists.selected" />
        </div>
        <div v-else>
          <p>Log in to see your playlists.</p>
        </div>
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

  > * {
    flex: 0 50%;
  }
}
</style>
