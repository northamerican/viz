<script setup lang="ts">
import { onMounted, ref } from "vue";
import { onGetTvState, onToggleTv } from "./TvState.telefunc";

const tvState = ref<boolean>(null);

const toggleTv = async () => {
  tvState.value = await onToggleTv();
};

onMounted(async () => {
  tvState.value = await onGetTvState();
});

// TODO: handle offline/online events
window.addEventListener("offline", () => {
  console.log("isoffline");
});
</script>

<template>
  <button @click="toggleTv" v-if="tvState !== null">
    {{ tvState ? "🌝" : "🌚" }}
  </button>
</template>
