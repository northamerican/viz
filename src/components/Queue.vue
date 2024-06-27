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
  onUpdateQueueFromPlaylist,
  onGetNextDownloadableQueueItem,
  onClearQueue,
  onUpdatePlaylistReference,
} from "./Queue.telefunc";
import { store } from "../store";
import players from "../players";
import { onSaveStore } from "../store.telefunc";
import { onLoadPlaylist } from "./Playlists.telefunc";

const props = defineProps<{ queue: Queue }>();
const isDownloadingQueue = ref(true);
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
  { target }: { target: HTMLInputElement }
) => {
  const checked = target.checked;
  await onUpdatePlaylistReference(props.queue.id, playlistReference.id, {
    updatesQueue: checked,
  });
};

const removeItem = async (queueItem: QueueItem) => {
  await onRemoveQueueItem(queueItem.id);
  store.updateQueuesStore();
};

const playQueue = async () => {
  await onPlayQueue(props.queue.id);
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

const clearQueue = async () => {
  const { videoEl } = store;
  await onClearQueue(props.queue.id);
  await store.updateQueuesStore();
  videoEl.pause();
  videoEl.load();
};

const updateQueueFromPlaylist = async () => {
  await onUpdateQueueFromPlaylist(props.queue.id);
  await store.updateQueuesStore();
};

const openDialog = (queueItem: QueueItem) => {
  dialogQueueItem.value = queueItem;
};

const closeDialog = () => {
  dialogQueueItem.value = null;
};

const actionsMenuOptions = (queueItem: QueueItem) => [
  // {
  //   action: () => downloadVideo(queueItem),
  //   label: "Get Video",
  //   disabled: queueItem.video?.downloaded,
  // },
  {
    action: () => openDialog(queueItem),
    label: "Replace Video...",
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

watch(() => props.queue.items.length, downloadQueue);
watch(props.queue.playlists, updateQueueFromPlaylist, { immediate: true });
watch(isDownloadingQueue, downloadQueue, { immediate: true });
</script>

<template>
  <div class="queue-controls">
    <label
      ><input type="checkbox" v-model="isDownloadingQueue" />Get Automatically
    </label>
    <button @click="clearQueue">Clear Queue</button>
    <button @click="playQueue">Play</button>
  </div>
  <div class="queue-item" v-if="props.queue.items.length">
    <ListItem
      v-for="item in props.queue.items"
      :key="item.id"
      :class="{ compact: isInterstitial(item.track) }"
    >
      <span class="track-type" v-text="trackTypeIcon(item.track.type)" />
      <div class="track-info">
        <strong>{{ item.track.name }}</strong>
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
  <QueueItemDialog :item="dialogQueueItem" :on-close="closeDialog" />
</template>

<style>
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
