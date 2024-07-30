<script setup lang="ts">
import type { AlternateVideo } from "Viz";
import { computed, ref } from "vue";

const props = defineProps<{ alternateVideo: AlternateVideo }>();
const showVideo = ref(false);
const thumbnail = ref(props.alternateVideo.thumbnail);
const thumbnailAspectRatio = computed(
  () => `${thumbnail.value?.width}/${thumbnail.value?.height}`
);
</script>

<template>
  <a @click="() => (showVideo = true)" class="video-thumb" v-if="!showVideo">
    <img
      :src="thumbnail?.url"
      :style="`aspect-ratio: ${thumbnailAspectRatio}`"
    />
  </a>
  <iframe
    :src="`https://www.youtube.com/embed/${props.alternateVideo.id}?rel=0&autoplay=1`"
    frameborder="0"
    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
    referrerpolicy="strict-origin-when-cross-origin"
    allowfullscreen
    :style="`aspect-ratio: ${thumbnailAspectRatio}`"
    v-else
  />
</template>

<style scoped>
iframe {
  width: 100%;
}
.video-thumb {
  cursor: pointer;

  img {
    width: 100%;
  }
}
</style>
