import players from "../../players";
import { Players } from "../../types/VizPlayer";
import spotify from "./spotify";

const playersWithApi: Players = {
  spotify: {
    ...players.spotify,
    api: spotify,
  },
  youtube: {
    ...players.youtube,
    api: spotify, //youtube
  },
};

export default playersWithApi;
