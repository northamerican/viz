<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, onUnmounted } from 'vue'
import type { AppState, Track } from 'Viz'

const props = defineProps<{ state: AppState }>()

const getVideo = async ({ artists, title }: Partial<Track>) => {
  axios.post('/video', {
    artist: artists[0],
    title
  })
}

const playPlaylist = () => {
  axios.post('/api/play/')
}

const playlistTitle = computed(
  () =>
    props.state.playlists.items?.find(
      playlist => playlist.id === props.state.selectedPlaylist.id
    ).name
)

let getTracklistInterval: NodeJS.Timeout
onMounted(async () => {
  // getCurrent()
  // getTrackList()
  getTracklistInterval = setInterval(() => {
    // getCurrent()
    // getTrackList()
  }, 5000)
})

onUnmounted(() => clearInterval(getTracklistInterval))
</script>

<template>
  <div v-if="state.selectedPlaylist">
    <header>
      <h2 class="title">
        <button>⇦</button>
        {{ playlistTitle }}
      </h2>
      <button class="play" @click="playPlaylist">▶</button>
    </header>
    <!-- <Track /> -->
    <div class="track" v-for="track in state.selectedPlaylist.items">
      <div class="track-play-state">
        <!-- <span v-if="isCurrentTrack(track)">
          <span v-if="state.currentTrack.isPlaying">▶</span>
          <span v-else>⏸</span>
        </span> -->
      </div>
      <div class="track-info">
        <strong>{{ track.title }}</strong>
        <br /><span class="track-artist" v-for="artist in track.artists">
          {{ artist }}
        </span>
      </div>
      <div class="track-actions">
        <button @click="() => getVideo(track)">get video</button>
      </div>
    </div>
  </div>
  <!-- <p v-else>Nothing playing.</p> -->
</template>

<style>
header {
  display: flex;
  justify-content: space-between;
  margin-inline: 1rem;

  & .title {
    margin-top: 0;
  }

  button.play {
  }
}

.track {
  display: flex;
  align-items: center;
  padding-block: 0.5rem;
  cursor: pointer;

  &:hover {
    background: rgba(0, 0, 0, 15%);
  }
}

.track-play-state {
  width: 1rem;
  margin-right: 0;
}

.track-info {
  .track-artist + .track-artist::before {
    content: ', ';
  }
}

.track-actions {
  margin-left: auto;
}
</style>
