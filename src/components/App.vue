<script setup lang="ts">
import VideoPlayer from "./VideoPlayer.vue";
import Library from "./Library.vue";
import Settings from "./Settings.vue";
import { onMounted } from "vue";
import { store } from "../store";

onMounted(() => {
  store.updateSettings();
});
</script>

<template>
  <main>
    <VideoPlayer />
    <Library />
    <Settings />
  </main>
</template>
