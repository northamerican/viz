import { ref, computed, watch } from "vue";
import { store } from "../store";

export function usePlayback() {
  const currentVideoTime = ref(0);
  const isPlaying = ref(false);

  const handlePause = () => {
    isPlaying.value = false;
  };

  const handlePlay = () => {
    isPlaying.value = true;
  };

  const handleTimeUpdate = () => {
    if (store.videoEl) {
      currentVideoTime.value = store.videoEl.currentTime;
    }
  };

  const playPause = () => {
    if (isPlaying.value) {
      store.videoEl.pause();
    } else {
      store.videoEl.play();
    }
  };

  const setupListeners = () => {
    if (!store.videoEl) return;

    store.videoEl.addEventListener("pause", handlePause);
    store.videoEl.addEventListener("play", handlePlay);

    ["loadeddata", "timeupdate"].forEach((eventType) => {
      store.videoEl.addEventListener(eventType, handleTimeUpdate);
    });
  };

  const cleanupListeners = () => {
    if (!store.videoEl) return;

    store.videoEl.removeEventListener("pause", handlePause);
    store.videoEl.removeEventListener("play", handlePlay);

    ["loadeddata", "timeupdate"].forEach((eventType) => {
      store.videoEl.removeEventListener(eventType, handleTimeUpdate);
    });
  };

  const activeQueue = computed(() =>
    store.queues.find((queue) => queue.active)
  );

  const totalDuration = computed(() =>
    Math.round(activeQueue.value?.totalDuration || 0)
  );

  const currentQueueItem = computed(() => {
    if (!activeQueue.value) return null;

    let accumulatedTime = 0;
    const queueItems = activeQueue.value.items;

    return queueItems.find((item) => {
      accumulatedTime += item.video?.duration || 0;
      return currentVideoTime.value <= accumulatedTime;
    });
  });

  watch(
    () => store.videoEl,
    (newVideoEl, oldVideoEl) => {
      if (oldVideoEl) cleanupListeners();
      if (newVideoEl) setupListeners();
    },
    { immediate: true }
  );

  return {
    currentVideoTime,
    isPlaying,
    activeQueue,
    totalDuration,
    currentQueueItem,
    playPause,
  };
}
