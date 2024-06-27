<script setup lang="ts">
const props = defineProps<{ videoId: string }>();
</script>

<template>
  <iframe
    width="560"
    height="315"
    :src="`https://www.youtube.com/embed/${props.videoId}`"
    frameborder="0"
    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
    referrerpolicy="strict-origin-when-cross-origin"
    allowfullscreen
  />
</template>
