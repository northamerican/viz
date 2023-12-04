<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { url } from '../consts'
// import '../hlsjs.ts'
import type { AppState } from 'Viz'

const props = defineProps<{ state: AppState }>()

const currentTime = ref(0)
const totalDuration = computed(() =>
  Math.round(props.state.queue?.totalDuration)
)

const seekTo = (e: any) => props.state.videoEl.fastSeek(e.target.value)

onMounted(() => {
  props.state.videoEl.addEventListener('timeupdate', () => {
    currentTime.value = Math.round(props.state.videoEl?.currentTime)
  })
})
</script>

<template>
  <section class="player">
    <video
      id="video"
      :ref="el => (props.state.videoEl = el)"
      :src="url.api.m3u"
      controls
      playsinline
      autoplay
    />
    <!-- <p>{{ currentTime }}/{{ totalDuration }}</p> -->
    <p>
      <input
        class="seeker"
        type="range"
        :value="currentTime"
        min="0"
        :max="totalDuration"
        @input="seekTo"
      />
    </p>
  </section>
</template>

<style scoped>
.player {
  flex-grow: 1;
  text-align: center;
}

video {
  width: auto;
  max-height: 80vh;
}

.seeker {
  width: 400px;
}
</style>
