<script setup lang="ts">
import { computed } from "vue";
import { store } from "../store";
import { m3u8Path } from "../consts";
import TvState from "./TvState.vue";
import { usePlayback } from "../composables/usePlayback";
import AirPlayControl from "./AirPlayControl.vue";
const { currentVideoTime, isPlaying, totalDuration, playPause } = usePlayback();
// import "../hlsjs.ts";

const seekTo = (e: Event) =>
  store.videoEl.fastSeek(+(e.target as HTMLInputElement).value);

const currentTimeDisplay = computed(() => Math.round(currentVideoTime.value));
</script>

<template>
  <section class="player">
    <div class="video">
      <video
        id="video"
        :ref="(el) => (store.videoEl = el as HTMLMediaElement)"
        :src="m3u8Path"
        @click="playPause"
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
          :value="currentVideoTime"
          min="0"
          step="0.1"
          :max="totalDuration"
          @input="seekTo"
        />
        <small class="time-display time-display--total">{{
          totalDuration || "-"
        }}</small>
        <AirPlayControl />
        <TvState />
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
