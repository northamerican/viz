<script setup lang="ts">
import VideoPlayer from "./VideoPlayer.vue";
import Library from "./Library.vue";
import Settings from "./Settings.vue";
import { onBeforeUnmount, onMounted } from "vue";
import { vizEventListener } from "../types/vizEventListener";

onMounted(() => {
  const eventSource = vizEventListener();

  onBeforeUnmount(() => {
    eventSource.close();
  });
});
</script>

<template>
  <main>
    <VideoPlayer />
    <Library />
    <Settings />
  </main>
</template>
