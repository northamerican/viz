<script setup lang="ts">
import { onMounted, ref } from "vue";
import { store } from "../store";

const airPlayButton = ref<HTMLButtonElement>(null);

onMounted(async () => {
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
  <button ref="airPlayButton" hidden>AirPlay</button>
</template>
