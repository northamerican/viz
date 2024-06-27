<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { store } from "../store";
import { m3u8Path } from "../consts";
import { onSaveStore } from "../store.telefunc";
import { onGetTvState, onToggleTv } from "./VideoPlayer.telefunc";
// import '../hlsjs.ts'

const currentTime = ref(0);
const currentTimeDisplay = ref(0);
const isPlaying = ref<boolean>(null);
const tvState = ref<boolean>(null);
const airPlayButton = ref<HTMLButtonElement>(null);
const totalDuration = computed(() =>
  Math.round(store.queues.find(({ active }) => active)?.totalDuration)
);

const seekTo = (e: Event) =>
  store.videoEl.fastSeek(+(e.target as HTMLInputElement).value);

const playPause = () => {
  const { videoEl } = store;
  videoEl.paused ? videoEl.play() : videoEl.pause();
};

const toggleTv = async () => {
  tvState.value = await onToggleTv();
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

  // @ts-expect-error WebKit vendor specific
  if (window.WebKitPlaybackTargetAvailabilityEvent) {
    store.videoEl.addEventListener(
      "webkitplaybacktargetavailabilitychanged",
      (event) =>
        // @ts-expect-error WebKit vendor specific
        (airPlayButton.value.hidden = event.availability === "not-available")
    );
    airPlayButton.value.addEventListener("click", () =>
      // @ts-expect-error WebKit vendor specific
      store.videoEl.webkitShowPlaybackTargetPicker()
    );
  }

  tvState.value = await onGetTvState();
  await store.updateStore();
});
</script>

<template>
  <section class="player">
    <video
      id="video"
      :ref="(el: HTMLMediaElement) => (store.videoEl = el)"
      :src="m3u8Path"
      controls
      playsinline
      :autoplay="store.isPlaying"
    />
    <div class="controls">
      <button @click="playPause">{{ isPlaying ? "⏸" : "▶" }}</button>
      <small class="time-display time-display--current">{{
        currentTimeDisplay
      }}</small>
      <input
        class="seeker"
        type="range"
        :value="currentTime"
        min="0"
        step="0.1"
        :max="totalDuration"
        @input="seekTo"
      />
      <small class="time-display time-display--total">{{
        totalDuration || "-"
      }}</small>
      <button ref="airPlayButton" hidden>AirPlay</button>
      <button @click="toggleTv" v-if="typeof tvState === 'boolean'">
        {{ tvState ? "🌝" : "🌚" }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.player {
  flex-grow: 1;
  text-align: center;

  #video {
    width: auto;
    height: 60vh;
    max-height: 60vh;
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
  .time-display {
    display: block;
    width: 4em;
  }
  .time-display--current {
    text-align: right;
  }
  .time-display--total {
    text-align: left;
  }
}
</style>
