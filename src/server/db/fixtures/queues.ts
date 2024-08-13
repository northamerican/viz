import { QueueItem } from "Viz";
import { v4 as uuidv4 } from "uuid";

export const vizIntroQueueItem: QueueItem = {
  id: uuidv4(),
  track: {
    id: "UExOOXE4VzFMbzhCclZkRXRpUXlqLUpxMy1xYklQekd6QS41NkI0NEY2RDEwNTU3Q0M2",
    player: "youtube",
    artists: [],
    name: "viz intro",
    playerUrl: "https://youtu.be/2uA2jaEmV9I",
    videoId: "2uA2jaEmV9I",
    addedAt: 0,
  },
  videoId: null,
  removed: false,
  playlistId: null,
  type: "interstitial",
};
