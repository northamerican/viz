<script setup lang="ts">
import type { QueueItem } from "Viz";
import { computed, ref } from "vue";
import YouTubeVideoEmbed from "./YouTubeVideoEmbed.vue";
import { mp4Path } from "../server/consts";

const props = defineProps<{ item: QueueItem; onClose: () => void }>();
const dialogEl = ref<HTMLDialogElement>(null);
const alternateVideos = computed(
  () => props.item.video.alternateVideos?.slice(0, 5)
);
</script>

<template>
  <dialog ref="dialogEl" v-if="props.item" open @click.self="props.onClose">
    <div class="dialog-content">
      <div>
        <button @click="props.onClose">X</button>
      </div>
      <!-- <YouTubeVideoEmbed :video-id="props.item.videoId" /> -->
      <video
        :src="`/hls/${props.item.videoId}/${props.item.videoId}.mp4`"
        controls
        playsinline
      ></video>
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

<style scoped>
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
  position: relative;
}

video {
  height: 100%;
}

.replace-video-option {
  margin-bottom: 2rem;
}
</style>
