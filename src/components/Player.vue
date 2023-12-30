<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { store } from "../store";
import { m3u8Path } from "../consts";
// import '../hlsjs.ts'

const currentTime = ref(0);
const totalDuration = computed(() => Math.round(store.queue?.totalDuration));

const seekTo = (e: Event) =>
  store.videoEl.fastSeek(+(e.target as HTMLInputElement).value);

onMounted(() => {
  store.videoEl.addEventListener("timeupdate", () => {
    currentTime.value = Math.round(store.videoEl?.currentTime);
  });
});
</script>

<template>
  <section class="player">
    <video
      id="video"
      :ref="(el) => (store.videoEl = el as HTMLMediaElement)"
      :src="m3u8Path"
      controls
      playsinline
      autoplay
    />
    <p>
      <small>{{ currentTime }}</small>
      <input
        class="seeker"
        type="range"
        :value="currentTime"
        min="0"
        :max="totalDuration"
        @input="seekTo"
      />
      <small>{{ totalDuration }}</small>
    </p>
  </section>
</template>

<style scoped>
.player {
  flex-grow: 1;
  text-align: center;
}

video {
  width: auto;
  max-height: 80vh;
}

.seeker {
  width: 400px;
}
</style>
