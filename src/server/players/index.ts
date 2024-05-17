import { VizPlayerConstructable } from "../../types/VizPlayer";
import spotify from "./spotify";
import youtube from "./youtube";

const playerApi: {
  [playerId: string]: VizPlayerConstructable;
} = {
  spotify: spotify,
  youtube: youtube,
};

export default playerApi;
