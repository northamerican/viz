<script setup lang="ts">
import type { QueueItem, QueuePlaylistReference } from "Viz";
import ListItem from "./ListItem.vue";
import ActionsMenu from "./ActionsMenu.vue";
import { onMounted, ref, watch } from "vue";
import {
  onGetVideo,
  onDownloadVideo,
  onDeleteQueues,
  onDeleteVideos,
  onRemoveQueueItem,
  onStartQueue,
  onUpdateQueueFromPlaylist,
  onGetNextDownloadableQueueItem,
} from "./Queue.telefunc";
import { store } from "../store";
import players from "../players";
import { onSaveStore } from "../store.telefunc";
import { onLoadPlaylist } from "./Playlists.telefunc";

// TODO store should have queues / 1:1 copy of the queues json?

const isDownloadingQueue = ref(false);

const getPlaylist = async (playlistReference: QueuePlaylistReference) => {
  store.view.playlist = null;
  const { playlist } = await onLoadPlaylist(
    playlistReference.account,
    playlistReference.id
  );
  store.view.playlist = playlist;
};

const playQueue = async () => {
  await onStartQueue();
  const { videoEl } = store;
  videoEl.load();
  videoEl.fastSeek ? videoEl.fastSeek(0) : (videoEl.currentTime = 0);
  videoEl.play();
  onSaveStore({ isPlaying: true });
};

const downloadVideo = async (queueItem: QueueItem) => {
  const { videoId, url } = await onGetVideo(store.queue.id, queueItem);
  await store.updateQueueStore();
  if (!videoId) return;
  await onDownloadVideo(videoId, url);
  await store.updateQueueStore();
  if (store.videoEl.currentTime === 0) {
    playQueue();
  }
};

const queueDownload = async () => {
  if (isDownloadingQueue.value) {
    const queueItem = await onGetNextDownloadableQueueItem();
    await downloadVideo(queueItem);
    queueDownload();
  }
};

const deleteQueueAndVideos = async () => {
  const { videoEl } = store;
  await Promise.all([onDeleteQueues(), onDeleteVideos()]);
  await store.updateQueueStore();
  videoEl.pause();
  videoEl.load();
};

const removeItem = async (queueItem: QueueItem) => {
  await onRemoveQueueItem(store.queue.id, queueItem.id);
  store.updateQueueStore();
};

const actionsMenuOptions = (queueItem: QueueItem) => [
  {
    action: () => downloadVideo(queueItem),
    label: "Get Video",
    disabled: queueItem.video?.downloaded,
  },
  { action: () => removeItem(queueItem), label: "Remove from Queue" },
  { action: () => {}, label: "Replace Video...", disabled: true },
  {},
  {
    action: () => {
      window.open(queueItem.video.sourceUrl, "_blank");
    },
    label: "Go to YouTube Video...",
    disabled: !queueItem.video?.sourceUrl,
  },
  {
    action: () => {
      window.open(queueItem.track.playerUrl, "_blank");
    },
    label: `Go to ${players[queueItem.track.player].name} Song...`,
  },
];

onMounted(async () => {
  await onUpdateQueueFromPlaylist();
  await store.updateQueueStore();
});

watch(isDownloadingQueue, queueDownload, { immediate: true });
watch(() => store.queue?.items.length, queueDownload);
</script>

<template>
  <div v-if="store.queue">
    <header>
      <h2>Queues</h2>
      <div>
        <button @click="deleteQueueAndVideos">X</button>
        <!-- <button @click="queueDownload">⬇</button> -->
        <label><input type="checkbox" v-model="isDownloadingQueue" />⬇</label>
        <button @click="playQueue">▶</button>
      </div>
    </header>
    <div v-if="store.queue.items.length">
      <ListItem v-for="item in store.queue.items" :key="item.id">
        <div class="track-info">
          <strong>{{ item.track.name }}</strong>
          <span class="track-state">
            <span v-if="item.video?.downloading">⌛︎</span>
            <span v-if="item.video?.downloaded">✔</span>
            <span
              v-if="item.video?.error || item.error"
              :title="item.video?.error || item.error"
              >X</span
            >
          </span>
          <br />
          <span
            class="track-artist"
            v-for="artist in item.track.artists"
            :key="artist"
          >
            {{ artist }}
          </span>
        </div>
        <div class="actions">
          <ActionsMenu :options="actionsMenuOptions(item)" />
        </div>
      </ListItem>

      <hr />
      <ListItem
        v-for="playlistReference in store.queue.playlists"
        :key="playlistReference.id"
      >
        <div>
          <!-- {{ playlistReference.type }} -->
          <span v-if="playlistReference.updatesQueue">updates from</span>
          {{ playlistReference.player }} playlist
          <br />

          <a href="" @click.prevent="getPlaylist(playlistReference)">
            <strong>{{ playlistReference.name }}</strong></a
          >

          by
          {{ playlistReference.account.displayName }}

          <br />
        </div>
      </ListItem>
    </div>
    <p v-else>Nothing queued.</p>
  </div>
</template>

<style>
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-inline: 0.5rem;
}

.track-info {
  .track-artist + .track-artist::before {
    content: ", ";
  }
}

.track-state::before {
  content: " ";
}
</style>
