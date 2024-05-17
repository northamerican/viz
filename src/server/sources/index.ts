import { youtube } from "./youtube";

const sources: {
  // [sourceId: string]: unknown; // VizSource;
  youtube: typeof youtube;
} = {
  youtube,
};

export default sources;
