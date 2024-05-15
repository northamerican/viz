import { VizPlayerConstructable } from "../../types/VizPlayer";
import spotify from "./spotify";
import youtube from "./youtube";

const playerApi: {
  // TODO [string: PlayerId]: VizPlayerConstructable;
  spotify: VizPlayerConstructable;
  youtube: VizPlayerConstructable;
} = {
  spotify: spotify,
  youtube: youtube,
};

export default playerApi;
