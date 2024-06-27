<script setup lang="ts">
import type { QueueItem } from "Viz";
import { computed, onMounted, onUnmounted, ref } from "vue";
import YouTubeVideoEmbed from "./YouTubeVideoEmbed.vue";

const props = defineProps<{ item: QueueItem; onClose: () => void }>();
const dialogEl = ref<HTMLDialogElement>(null);
const alternateVideos = computed(
  () => props.item.video.alternateVideos?.slice(0, 5)
);

const escapeClose = (e: KeyboardEvent) => {
  if (props.item && e.code === "Escape") {
    props.onClose();
  }
};
onMounted(() => {
  window.addEventListener("keypress", escapeClose);
});
onUnmounted(() => {
  window.removeEventListener("keypress", escapeClose);
});
</script>

<template>
  <dialog ref="dialogEl" v-if="props.item" open @click.self="props.onClose">
    <div class="dialog-content">
      <div>
        <button @click="props.onClose">X</button>
      </div>
      <YouTubeVideoEmbed :video-id="props.item.videoId" />
      <hr v-if="alternateVideos" />
      <div
        class="replace-video-option"
        v-for="videoId in alternateVideos"
        :key="videoId"
      >
        <YouTubeVideoEmbed :video-id="videoId" />
        <br />
        <button disabled>Replace with this video</button>
      </div>
    </div>
  </dialog>
</template>

<style>
dialog {
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  border: none;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgb(0 0 0 / 25%);
}

.dialog-content {
  background: var(--background);
  padding: 16px;
  flex-direction: column;
  max-height: 50vh;
  overflow-y: scroll;
}

.replace-video-option {
  margin-bottom: 2rem;
}
</style>
