<script setup lang="ts">
import type { QueueItem } from "Viz";
import { ref } from "vue";

const props = defineProps<{ item: QueueItem; onClose: () => void }>();
const dialogEl = ref<HTMLDialogElement>(null);
</script>

<template>
  <dialog ref="dialogEl" v-if="props.item" open @click.self="props.onClose">
    <div class="dialog-content">
      <div>
        <button @click="props.onClose">X</button>
      </div>
      <iframe
        width="560"
        height="315"
        :src="`https://www.youtube.com/embed/${props.item.videoId}`"
        frameborder="0"
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        referrerpolicy="strict-origin-when-cross-origin"
        allowfullscreen
      ></iframe>
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
}
</style>
