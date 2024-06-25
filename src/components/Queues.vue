<script setup lang="ts">
import { onMounted } from "vue";
import { store } from "../store";
import Queue from "./Queue.vue";

onMounted(async () => {
  store.updateQueuesStore();
});
</script>

<template>
  <header>
    <h2>Queues</h2>
  </header>

  <div v-for="(queue, i) in store.queues" :key="i">
    <h3>Queue {{ i + 1 }}</h3>
    <Queue :queue="queue" />
  </div>
</template>

<style>
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-inline: 0.5rem;
}
</style>
