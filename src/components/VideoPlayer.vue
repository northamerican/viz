<script setup lang="ts">
import { computed, ComputedRef, onMounted, ref, watch } from "vue";
import { store } from "../store";
import { m3u8Path } from "../consts";
import type { QueueWithVideos } from "Viz";
import { trackArtistsJoin } from "../helpers";
import vizLogo from "../assets/viz-logo.png";
import TvState from "./TvState.vue";
// import '../hlsjs.ts'

const currentTime = ref(0);
const isPlaying = ref<boolean>(false);
const airPlayButton = ref<HTMLButtonElement>(null);
const canSetMediaSession = "mediaSession" in navigator;

const activeQueue = computed(() =>
  store.queues.find(({ active }) => active)
) as ComputedRef<QueueWithVideos>;
const totalDuration = computed(() =>
  Math.round(activeQueue.value?.totalDuration)
);
const currentTimeDisplay = computed(() => Math.round(currentTime.value));
const currentQueueItem = computed(() => {
  if (!activeQueue.value) return null;
  let accumulatedTime = 0;
  const queueItems = activeQueue.value.items;
  return queueItems.find((item) => {
    accumulatedTime += item.video?.duration;
    return currentTime.value <= accumulatedTime;
  });
});

const seekTo = (e: Event) =>
  store.videoEl.fastSeek(+(e.target as HTMLInputElement).value);
const playPause = () => {
  const { videoEl } = store;
  isPlaying.value ? videoEl.pause() : videoEl.play();
};

watch(currentQueueItem, (queueItem) => {
  if (canSetMediaSession) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: `viz - ${queueItem.track.name}`,
      artist: trackArtistsJoin(queueItem.track.artists),
      album: activeQueue.value.name,
      artwork: [
        "96x96",
        "128x128",
        "192x192",
        "256x256",
        "384x384",
        "512x512",
      ].map((sizes) => ({
        src: queueItem.video.thumbnail?.url || vizLogo,
        sizes,
        type: queueItem.video.thumbnail ? "image/jpeg" : "image/png",
      })),
    });
  }
});

onMounted(async () => {
  store.videoEl.addEventListener("pause", () => {
    isPlaying.value = false;
  });

  store.videoEl.addEventListener("play", () => {
    isPlaying.value = true;
  });

  store.videoEl.addEventListener("timeupdate", () => {
    currentTime.value = store.videoEl?.currentTime;
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
});
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
