import { onMounted, onUnmounted } from "vue";
import { trackArtistsJoin } from "../helpers";
import { store } from "../store";
import vizLogo from "../assets/viz-logo.png";
import { usePlayback } from "./usePlayback";

const canSetMediaSession = "mediaSession" in navigator;

export const useMediaSessionMetadata = () => {
  const { activeQueue, currentQueueItem } = usePlayback();
  const updateMediaSession = () => {
    if (!activeQueue.value) return;

    const queueItem = currentQueueItem.value;

    if (canSetMediaSession && queueItem?.track) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `viz - ${queueItem.track.name}`,
        artist: trackArtistsJoin(queueItem.track.artists),
        album: activeQueue.value.name,
        artwork: [
          "96x96",
          "128x128",
          "192x192",
          "256x256",
          "384x384",
          "512x512",
        ].map((sizes) => ({
          src: queueItem.video.thumbnail?.url || vizLogo,
          sizes,
          type: queueItem.video.thumbnail ? "image/jpeg" : "image/png",
        })),
      });
    }
  };

  onMounted(() => {
    if (store.videoEl) {
      store.videoEl.addEventListener("timeupdate", updateMediaSession);
    }
  });

  onUnmounted(() => {
    if (store.videoEl) {
      store.videoEl.removeEventListener("timeupdate", updateMediaSession);
    }
  });
};
