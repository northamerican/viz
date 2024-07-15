<script setup lang="ts">
import type { Playlist, Track } from "Viz";
import ListItem from "./ListItem.vue";
import ActionsMenu from "./ActionsMenu.vue";
import { onAddToQueue } from "./Playlist.telefunc";
import { store } from "../store";

const props = defineProps<{ playlist: Playlist }>();

const addToQueue = async (tracks: Track[]) => {
  const { id, name, player, account } = props.playlist;
  const queueItems = tracks.map((track) => {
    return { track, videoId: null, removed: false };
  });
  await onAddToQueue(store.view.queue?.id, queueItems, {
    id,
    name,
    player,
    account: {
      id: account.id,
      displayName: account.displayName,
      profileUrl: account.profileUrl,
      player: account.player,
    },
    updatesQueue: true,
    type: tracks[0].type,
  });
  store.updateQueues();
};

const deselectPlaylist = () => {
  store.view.playlist = null;
};

const actionsMenuOptions = (track: Track) => [
  { action: () => addToQueue([track]), label: "Add to Queue" },
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
        <button @click="() => addToQueue(props.playlist.tracks)">+</button>
        <!-- TODO Function to have queue follow updates to this playlist -->
        <!-- <button>Follow playlist</button> -->
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
        <ActionsMenu :options="actionsMenuOptions(track)" />
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
