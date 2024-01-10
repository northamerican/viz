import { VizPlayerConstructable } from "../../types/VizPlayer";
import spotify from "./spotify";

const playerApi: {
  // [string: PlayerId]: VizPlayerConstructable;
  spotify: VizPlayerConstructable;
  youtube: VizPlayerConstructable;
} = {
  spotify: spotify,
  youtube: spotify,
};

export default playerApi;
