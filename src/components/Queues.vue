<script setup lang="ts">
import { onMounted } from "vue";
import { store } from "../store";
import Queue from "./Queue.vue";

onMounted(async () => {
  await store.updateQueues();
});
</script>

<template>
  <header>
    <h2>Queues</h2>
  </header>

  <nav v-for="queue in store.queues" :key="queue.id">
    <h3 :class="['queue-name', { active: queue.active }]">{{ queue.name }}</h3>
  </nav>
  <div v-for="queue in store.queues" :key="queue.id">
    <Queue :queue="queue" v-if="queue.active" />
  </div>
</template>

<style scoped>
.queue-name {
  &.active {
    text-decoration: underline;
  }
}
</style>
