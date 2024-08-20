<script setup lang="ts">
import type { QueueItem } from "Viz";
import { computed, ref } from "vue";
import YouTubeVideoEmbed from "./YouTubeVideoEmbed.vue";
import { onReplaceQueueItemVideo } from "./QueueItemDialog.telefunc";
import { trackArtistsJoin } from "../helpers";
import { dialogAlternateVideoCount, hlsPath } from "../consts";

const props = defineProps<{ item: QueueItem; onClose: () => void }>();
const dialogEl = ref<HTMLDialogElement>(null);
const alternateVideos = computed(() =>
  props.item.video.alternateVideos?.slice(0, dialogAlternateVideoCount)
);
</script>

<template>
  <dialog ref="dialogEl" v-if="props.item" open @click.self="props.onClose">
    <div class="dialog-content">
      <div class="track-info">
        <h1>{{ props.item.track.name }}</h1>
        <h3>{{ trackArtistsJoin(props.item.track.artists) }}</h3>
      </div>
      <!-- <button class="close-button" @click="props.onClose">X</button> -->
      <video
        :src="`${hlsPath}/${props.item.videoId}/${props.item.videoId}.mp4`"
        :poster="props.item.video.thumbnail?.url"
        controls
        playsinline
      ></video>
      <div v-if="alternateVideos">
        <h3>Alternate videos</h3>
        <div class="replace-video-options">
          <div
            class="replace-video-option"
            v-for="alternateVideo in alternateVideos"
            :key="alternateVideo.id"
          >
            <YouTubeVideoEmbed :alternate-video="alternateVideo" />
            <div class="alternate-video-info">
              <div class="alternate-video-title-info">
                <h3 class="name">{{ alternateVideo.name }}</h3>
                <h4 class="author">{{ alternateVideo.author }}</h4>
              </div>
              <button
                @click="
                  onReplaceQueueItemVideo(item, alternateVideo);
                  props.onClose();
                "
              >
                Replace with this video
              </button>
            </div>
          </div>
        </div>
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

.close-button {
  position: absolute;
  width: 30px;
  height: 30px;
  top: 0;
  right: 0;
}

.dialog-content {
  background: var(--background);
  padding: 1rem;
  height: 85vh;
  width: 50vw;
  flex-direction: column;
  overflow-y: scroll;
  position: relative;

  .track-info {
    h1 {
      margin: 0;
    }
    h3 {
      margin-top: 0;
    }
  }
}

video {
  display: block;
  width: 100%;
}

.replace-video-options {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.replace-video-option {
  max-width: 100%;

  img {
    width: 600px;
  }
}

.alternate-video-info {
  display: flex;
  align-items: center;
  width: 100%;

  .alternate-video-title-info {
    flex-grow: 1;
  }
  .name {
    margin-block: 0;
  }
  .author {
    margin-block: 0;
  }
}
</style>
