<script setup lang="ts">
import type { Playlist, Track, ItemType } from "Viz";
import ListItem from "./ListItem.vue";
import ActionsMenu from "./ActionsMenu.vue";
import { onAddItemsToQueue, onAddPlaylistToQueue } from "./Playlist.telefunc";
import { store } from "../store";
import players from "../players";
import { computed } from "vue";

const props = defineProps<{ playlist: Playlist }>();

const playerAllowedTypes = computed(() => players[props.playlist.player].types);

const addItemsToQueue = async (tracks: Track[], itemType: ItemType) => {
  const queueId = store.view.queue?.id;

  onAddItemsToQueue(
    queueId,
    tracks.map((track) => ({
      track,
      videoId: null,
      removed: false,
      playlistId: props.playlist.id,
      type: itemType,
    }))
  );
};

const addPlaylistToQueue = async (itemType: ItemType) => {
  const { id, name, player, account } = props.playlist;
  const queueId = store.view.queue?.id;

  onAddPlaylistToQueue(queueId, {
    id,
    name,
    player,
    account: {
      id: account.id,
      displayName: account.displayName,
      profileUrl: account.profileUrl,
      player: account.player,
    },
    updatesQueue: false,
    type: itemType,
  });
};

const deselectPlaylist = () => {
  store.view.playlist = null;
};

const playlistActionsMenuOptions = () => [
  {
    action: () => addPlaylistToQueue("track"),
    label: "Add as Track Playlist",
    disabled: !playerAllowedTypes.value.includes("track"),
  },
  {
    action: () => addPlaylistToQueue("interstitial"),
    label: "Add as Interstital Playlist",
    disabled: !playerAllowedTypes.value.includes("interstitial"),
  },
];

const trackActionsMenuOptions = (track: Track) => [
  {
    action: () => addItemsToQueue([track], "track"),
    label: "Add to Queue as Track",
    disabled: !playerAllowedTypes.value.includes("track"),
  },
  {
    action: () => addItemsToQueue([track], "interstitial"),
    label: "Add to Queue as Interstitial",
    disabled: !playerAllowedTypes.value.includes("interstitial"),
  },
];
</script>

<template>
  <div v-if="props.playlist">
    <header>
      <h2>
        <button @click="deselectPlaylist">⇦</button>
        {{ props.playlist.name }}
      </h2>
      <div>
        <ActionsMenu :options="playlistActionsMenuOptions()" />
      </div>
    </header>
    <ListItem v-for="track in props.playlist.tracks" :key="track.id">
      <div class="info">
        <strong>{{ track.name }}</strong>
        <br />
        <span
          class="track-artist"
          v-for="artist in track.artists"
          :key="artist"
        >
          {{ artist }}
        </span>
      </div>
      <div class="actions">
        <ActionsMenu :options="trackActionsMenuOptions(track)" />
      </div>
    </ListItem>
  </div>
</template>

<style scoped>
.info {
  .track-artist + .track-artist::before {
    content: ", ";
  }
}
</style>
