<script setup lang="ts">
import type { Queue, QueueItem, QueuePlaylistReference, ItemType } from "Viz";
import ListItem from "./ListItem.vue";
import ActionsMenu from "./ActionsMenu.vue";
import QueueItemDialog from "./QueueItemDialog.vue";
import { onMounted, ref, watch } from "vue";
import {
  onGetVideo,
  onDownloadVideo,
  onRemoveQueueItem,
  onPlayQueue,
  onUpdateQueueFromPlaylists,
  onGetNextDownloadableQueueItem,
  onClearQueue,
  onUpdatePlaylistReference,
  onRemovePlaylistReference,
} from "./Queue.telefunc";
import { store } from "../store";
import players from "../players";
import { onLoadPlaylist } from "./Playlists.telefunc";
import { newTracksInterval } from "../consts";
import { trackArtistsJoin } from "../server/helpers";

const props = defineProps<{ queue: Queue }>();
const dialogQueueItem = ref<QueueItem>(null);

// TODO separate queue items, sources

const isInterstitial = (item: QueueItem) => item.type === "interstitial";
const itemTypeIcon = (type: ItemType) => {
  switch (type) {
    case "interstitial":
      return "🎬";
    case "track":
      return "🎵";
    default:
      return "";
  }
};

const getPlaylist = async (playlistReference: QueuePlaylistReference) => {
  store.view.playlist = null;
  const { playlist } = await onLoadPlaylist(
    playlistReference.account,
    playlistReference.id
  );
  store.view.playlist = playlist;
};

const updatePlaylist = async (
  playlistReference: QueuePlaylistReference,
  event: Event
) => {
  const checked = (event.target as HTMLInputElement).checked;
  await onUpdatePlaylistReference(props.queue.id, playlistReference.id, {
    updatesQueue: checked,
  });
};

const removeItem = async (queueItem: QueueItem) => {
  await onRemoveQueueItem(queueItem.id);
};

const playQueue = async () => {
  await onPlayQueue(props.queue.id);
  const { videoEl } = store;
  videoEl.load();
  videoEl.fastSeek ? videoEl.fastSeek(0) : (videoEl.currentTime = 0);
  videoEl.play();
};

const downloadVideo = async (queueItem: QueueItem) => {
  const { videoId, url } = await onGetVideo(queueItem);
  if (!videoId) return;
  await onDownloadVideo(videoId, url);
  if (store.videoEl.currentTime === 0) {
    playQueue();
  }
};

const downloadQueue = async () => {
  if (store.settings.downloadQueueItems) {
    const queueItem = await onGetNextDownloadableQueueItem();
    if (queueItem) {
      await downloadVideo(queueItem);
      // Recursive function
      downloadQueue();
    }
  }
};

const clearQueue = async () => {
  const { videoEl } = store;
  await onClearQueue(props.queue.id);
  videoEl.pause();
  videoEl.load();
};

const updateQueueFromPlaylist = async () => {
  await onUpdateQueueFromPlaylists(props.queue.id);
};

const openQueueItemDialog = (queueItem: QueueItem) => {
  dialogQueueItem.value = queueItem;
};

const closeQueueItemDialog = () => {
  dialogQueueItem.value = null;
};

const queueItemActionsMenuOptions = (queueItem: QueueItem) => [
  {
    action: () => downloadVideo(queueItem),
    label: "Get Video",
    disabled: queueItem.video?.downloaded || queueItem.video?.downloading,
  },
  {
    action: () => openQueueItemDialog(queueItem),
    label: "Get Info...",
    disabled: !queueItem.video,
  },
  { action: () => removeItem(queueItem), label: "Remove from Queue" },
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
const playlistActionsMenuOptions = (
  playlistReference: QueuePlaylistReference
) => [
  {
    action: () =>
      onRemovePlaylistReference(props.queue.id, playlistReference.id),
    label: "Remove playlist",
  },
];
onMounted(() => {
  // TODO these could be server events
  // Download queue items when they are added
  watch(() => props.queue.items.length, downloadQueue);
  // Watch for undownloaded queue items, dl recursively
  watch(() => store.settings.downloadQueueItems, downloadQueue, {
    immediate: true,
  });

  // Add new items from the queue's playlists
  // When a playlist is added
  watch(() => props.queue.playlists.length, updateQueueFromPlaylist);
  // At a regular interval
  setInterval(updateQueueFromPlaylist, newTracksInterval);
});
</script>

<template>
  <div class="queue-controls">
    <button @click="clearQueue">🚫 Clear</button>
    <button @click="playQueue">▶ Play</button>
  </div>
  <div class="queue-item" v-if="props.queue.items.length">
    <ListItem
      v-for="item in props.queue.items"
      :key="item.id"
      :class="{ compact: isInterstitial(item) }"
    >
      <span class="track-type" v-text="itemTypeIcon(item.type)" />
      <div class="track-info">
        <strong
          :class="['track-name', { clickable: item.video }]"
          @click="item.video ? openQueueItemDialog(item) : null"
          >{{ item.track.name }}</strong
        >
        <span class="track-state">
          <span v-if="item.video?.downloading">⌛︎</span>
          <span
            v-else-if="item.video?.error || item.error"
            :title="item.video?.error || item.error"
            >❌</span
          >
          <span v-else-if="!item.video?.downloaded">❓</span>
        </span>
        <br />
        <span v-if="!isInterstitial(item)">
          {{ trackArtistsJoin(item.track.artists) }}
        </span>
      </div>
      <div class="actions">
        <ActionsMenu :options="queueItemActionsMenuOptions(item)" />
      </div>
    </ListItem>
    <hr />
    <h3>Sources</h3>
    <ListItem
      v-for="playlistReference in props.queue.playlists"
      :key="playlistReference.id"
    >
      <span class="track-type" v-text="itemTypeIcon(playlistReference.type)" />
      <div>
        <a href="" @click.prevent="getPlaylist(playlistReference)">
          <strong>{{ playlistReference.name }}</strong></a
        >

        by
        {{ playlistReference.account.displayName }}

        <br />
        <label>
          <input
            type="checkbox"
            v-model="playlistReference.updatesQueue"
            @change="updatePlaylist(playlistReference, $event)"
          />Updates Queue</label
        >
      </div>
      <div class="actions">
        <ActionsMenu :options="playlistActionsMenuOptions(playlistReference)" />
      </div>
    </ListItem>
  </div>
  <div v-else>No items in queue.</div>
  <QueueItemDialog :item="dialogQueueItem" :on-close="closeQueueItemDialog" />
</template>

<style scoped>
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-inline: 0.5rem;
}

.queue-controls {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.queue-item {
  cursor: default;
}

.track-type {
  margin-right: 0.5em;
}

.track-info {
  .track-state::before {
    content: " ";
  }
}
</style>
