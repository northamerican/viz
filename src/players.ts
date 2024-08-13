import { Players } from "./types/VizPlayer";

const players: Players = {
  spotify: {
    id: "spotify",
    name: "Spotify",
    types: ["track"],
  },
  youtube: {
    id: "youtube",
    name: "YouTube",
    types: ["track", "interstitial"],
  },
};

export default players;
