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
} from "./Queues.telefunc";
import { store } from "../store";
import players from "../players";
import { onSaveStore } from "../store.telefunc";
import { onLoadPlaylist } from "./Playlists.telefunc";

// TODO store should have queues / 1:1 copy of the queues json?

const isDownloadingQueue = ref(false);
const isUpdatingQueue = ref(false);

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
  const { videoId, url } = await onGetVideo(queueItem);
  await store.updateQueuesStore();
  if (!videoId) return;
  await onDownloadVideo(videoId, url);
  await store.updateQueuesStore();
  if (store.videoEl.currentTime === 0) {
    playQueue();
  }
};

const downloadQueue = async () => {
  if (isDownloadingQueue.value) {
    const queueItem = await onGetNextDownloadableQueueItem();
    if (queueItem) {
      await downloadVideo(queueItem);
      downloadQueue();
    }
  }
};

const updateQueueFromPlaylist = async () => {
  if (isUpdatingQueue.value) {
    await onUpdateQueueFromPlaylist();
    await store.updateQueuesStore();
  }
};

const deleteQueueAndVideos = async () => {
  const { videoEl } = store;
  await Promise.all([onDeleteQueues(), onDeleteVideos()]);
  await store.updateQueuesStore();
  videoEl.pause();
  videoEl.load();
};

const removeItem = async (queueItem: QueueItem) => {
  await onRemoveQueueItem(queueItem.id);
  store.updateQueuesStore();
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
  store.updateQueuesStore();
});

watch(isDownloadingQueue, downloadQueue, { immediate: true });
watch(isUpdatingQueue, updateQueueFromPlaylist, { immediate: true });
</script>

<template>
  <header>
    <h2>Queues</h2>
    <div>
      <label><input type="checkbox" v-model="isDownloadingQueue" />⬇️</label>
      <label><input type="checkbox" v-model="isUpdatingQueue" />🔄</label>
      <button @click="deleteQueueAndVideos">X</button>
      <button @click="playQueue">▶</button>
    </div>
  </header>

  <div v-for="(_, i) in store.queues" :key="i">
    <h3>Queue {{ i + 1 }}</h3>
  </div>

  <div v-for="(queue, i) in store.queues" :key="i">
    <div v-if="queue.items.length">
      <ListItem v-for="item in queue.items" :key="item.id">
        <span class="track-type">
          <span v-if="item.track.type === 'track'">🎵</span>
          <span v-if="item.track.type === 'interstitial'">🎬</span>
        </span>
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
      <h3>Sources</h3>
      <ListItem
        v-for="playlistReference in queue.playlists"
        :key="playlistReference.id"
      >
        <div>
          <strong>{{ playlistReference.type }}s&nbsp;</strong>
          <span v-if="playlistReference.updatesQueue">update from</span>
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
    <div v-else>No items in queue.</div>
  </div>
</template>

<style>
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-inline: 0.5rem;
}
.track-type {
  margin-right: 0.5em;
}

.track-info {
  .track-artist + .track-artist::before {
    content: ", ";
  }

  .track-state::before {
    content: " ";
  }
}
</style>
