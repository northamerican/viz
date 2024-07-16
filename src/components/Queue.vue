<script setup lang="ts">
import type {
  Queue,
  QueueItem,
  QueuePlaylistReference,
  Track,
  TrackType,
} from "Viz";
import ListItem from "./ListItem.vue";
import ActionsMenu from "./ActionsMenu.vue";
import QueueItemDialog from "./QueueItemDialog.vue";
import { ref, watch } from "vue";
import {
  onGetVideo,
  onDownloadVideo,
  onRemoveQueueItem,
  onPlayQueue,
  onGetNextDownloadingInQueue,
  onUpdateQueueFromPlaylists,
  onGetNextDownloadableQueueItem,
  onClearQueue,
  onUpdatePlaylistReference,
} from "./Queue.telefunc";
import { store } from "../store";
import players from "../players";
import { onLoadPlaylist } from "./Playlists.telefunc";

const props = defineProps<{ queue: Queue }>();
const dialogQueueItem = ref<QueueItem>(null);

// TODO separate queue items, sources

const isInterstitial = (track: Track) => track.type === "interstitial";
const trackTypeIcon = (type: TrackType) =>
  type === "interstitial" ? "🎬" : "🎵";

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
  store.updateQueues();
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
  await store.updateQueues();
  if (!videoId) return;
  await onDownloadVideo(videoId, url);
  await store.updateQueues();
  if (store.videoEl.currentTime === 0) {
    playQueue();
  }
};

const checkForDownloadingQueueItem = async () => {
  // Recursively check for downloading queue item completion
  if (await onGetNextDownloadingInQueue()) {
    return setTimeout(checkForDownloadingQueueItem, 250);
  }
  // Update queue on completion
  await store.updateQueues();
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
  await store.updateQueues();
  videoEl.pause();
  videoEl.load();
};

const updateQueueFromPlaylist = async () => {
  await onUpdateQueueFromPlaylists(props.queue.id);
  await store.updateQueues();
};

const openQueueItemDialog = (queueItem: QueueItem) => {
  dialogQueueItem.value = queueItem;
};

const closeQueueItemDialog = () => {
  dialogQueueItem.value = null;
};

const actionsMenuOptions = (queueItem: QueueItem) => [
  {
    action: () => downloadVideo(queueItem),
    label: "Get Video",
    disabled: queueItem.video?.downloaded,
  },
  {
    action: () => openQueueItemDialog(queueItem),
    label: "Replace Video...",
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

// Download queue items when they are added
watch(() => props.queue.items.length, downloadQueue);
// Add new items from the queue's playlists
watch(props.queue.playlists, updateQueueFromPlaylist, {
  immediate: true,
});
// Watch for undowloaded queue items
watch(() => store.settings.downloadQueueItems, downloadQueue, {
  immediate: true,
});
// Check for completion of downloading queue item on init
checkForDownloadingQueueItem();
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
      :class="{ compact: isInterstitial(item.track) }"
    >
      <span class="track-type" v-text="trackTypeIcon(item.track.type)" />
      <div class="track-info">
        <strong
          :class="['track-name', { clickable: item.video }]"
          @click="openQueueItemDialog(item)"
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
        <span v-if="!isInterstitial(item.track)">
          <span
            class="track-artist"
            v-for="artist in item.track.artists"
            :key="artist"
          >
            {{ artist }}
          </span>
        </span>
      </div>
      <div class="actions">
        <ActionsMenu :options="actionsMenuOptions(item)" />
      </div>
    </ListItem>
    <hr />
    <h3>Sources</h3>
    <ListItem
      v-for="playlistReference in props.queue.playlists"
      :key="playlistReference.id"
    >
      <span class="track-type" v-text="trackTypeIcon(playlistReference.type)" />
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
  .track-artist + .track-artist::before {
    content: ", ";
  }

  .track-state::before {
    content: " ";
  }
}
</style>
