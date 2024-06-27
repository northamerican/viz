<script setup lang="ts">
import { onMounted } from "vue";
import { store } from "../store";
import Queue from "./Queue.vue";

onMounted(async () => {
  await store.updateQueuesStore();
});
</script>

<template>
  <header>
    <h2>Queues</h2>
  </header>

  <div v-for="queue in store.queues" :key="queue.id">
    <h3>{{ queue.name }} <small v-if="queue.active">▶️</small></h3>
  </div>
  <div v-for="queue in store.queues" :key="queue.id">
    <Queue :queue="queue" v-if="queue.active" />
  </div>
</template>

<style scoped>
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-inline: 0.5rem;
}
</style>
