<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { store } from "../store";
import { m3u8Path } from "../consts";
import { onGetTvState, onToggleTv } from "./VideoPlayer.telefunc";
// import '../hlsjs.ts'

const currentTime = ref(0);
const currentTimeDisplay = ref(0);
const tvState = ref<boolean>(null);
const isPlaying = ref<boolean>(false);
const airPlayButton = ref<HTMLButtonElement>(null);

const totalDuration = computed(() =>
  Math.round(store.queues.find(({ active }) => active)?.totalDuration)
);

const seekTo = (e: Event) =>
  store.videoEl.fastSeek(+(e.target as HTMLInputElement).value);

const playPause = () => {
  const { videoEl } = store;
  isPlaying.value ? videoEl.pause() : videoEl.play();
};

const toggleTv = async () => {
  tvState.value = await onToggleTv();
};

onMounted(async () => {
  store.videoEl.addEventListener("pause", () => {
    isPlaying.value = false;
  });

  store.videoEl.addEventListener("play", () => {
    isPlaying.value = true;
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
});
</script>

<template>
  <section class="player">
    <div class="video">
      <video
        id="video"
        :ref="(el) => (store.videoEl = el as HTMLMediaElement)"
        :src="m3u8Path"
        playsinline
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
        <button @click="toggleTv" v-if="tvState !== null">
          {{ tvState ? "🌝" : "🌚" }}
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.player {
  display: flex;
  justify-content: center;
  text-align: center;
  margin: 0 auto;

  .video {
    display: flex;
    flex-direction: column;

    video {
      display: flex;
      width: auto;
      max-height: 40vh;
      min-height: 260px;
      aspect-ratio: 16 / 9;
    }
  }

  .controls {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 24px;
    gap: 10px;

    .seeker {
      flex-grow: 1;
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
}
</style>
