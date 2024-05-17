<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { store } from "../store";
import { m3u8Path } from "../consts";
import { onSaveStore } from "../store.telefunc";
// import '../hlsjs.ts'

const currentTime = ref(0);
const currentTimeDisplay = ref(0);
const isPlaying = ref(null);
const totalDuration = computed(() => Math.round(store.queue?.totalDuration));

const seekTo = (e: Event) =>
  store.videoEl.fastSeek(+(e.target as HTMLInputElement).value);

const playPause = () => {
  const { videoEl } = store;
  videoEl.paused ? videoEl.play() : videoEl.pause();
};

onMounted(async () => {
  store.videoEl.addEventListener("pause", () => {
    isPlaying.value = false;
    onSaveStore({ isPlaying: false });
  });

  store.videoEl.addEventListener("play", () => {
    isPlaying.value = true;
    onSaveStore({ isPlaying: true });
  });

  store.videoEl.addEventListener("timeupdate", () => {
    currentTime.value = store.videoEl?.currentTime;
    currentTimeDisplay.value = Math.round(store.videoEl?.currentTime);
  });

  await store.updateStore();
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
      :autoplay="store.isPlaying"
    />
    <div class="controls">
      <button @click="playPause">{{ isPlaying ? "⏸" : "▶" }}</button>
      <small>{{ currentTimeDisplay }}</small>
      <input
        class="seeker"
        type="range"
        :value="currentTime"
        min="0"
        step="0.1"
        :max="totalDuration"
        @input="seekTo"
      />
      <small>{{ totalDuration }}</small>
    </div>
  </section>
</template>

<style scoped>
.player {
  flex-grow: 1;
  text-align: center;

  #video {
    width: auto;
    max-height: 80vh;
  }
}

.controls {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  gap: 10px;
  .seeker {
    width: 400px;
  }
}
</style>
