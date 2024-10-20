import { getLocalIp } from "./helpers";

const localIp = getLocalIp();
if (!localIp) throw "Unable to determine local IP";

const isLocal = process.argv.includes("--local");
const localHost = process.env.LOCALHOST;
export const port = +process.env.PORT;
export const appHost = isLocal ? localHost : localIp;
export const appUrl = `http://${appHost}:${port}/`;

export const projectRoot = new URL(import.meta.url + "/../../..").pathname;
export const hlsDir = `${projectRoot}public/hls/`;
export const hlsSegmentPath = (
  videoId: string,
  segmentIndex: number | string
) => `/hls/${videoId}/${videoId}${segmentIndex}.ts`;

export const dbDir = `${projectRoot}src/server/db/data/`;

export const accountsDbName = "accounts";
export const settingsDbName = "settings";
export const queuesDbName = "queues";
export const videosDbName = "videos";
