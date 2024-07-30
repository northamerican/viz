import { getLocalIp } from "./helpers";

const localIp = getLocalIp();
if (!localIp) throw "Unable to determine local IP";

const isLocal = process.argv.includes("--local");
const remoteHost = localIp;
const localHost = process.env.LOCALHOST;
export const port = +process.env.PORT;
export const appHost = isLocal ? localHost : remoteHost;
export const appUrl = `http://${appHost}:${port}/`;

export const projectRoot = new URL(import.meta.url + "/../../..").pathname;
export const hlsDir = `${projectRoot}public/hls/`;
export const hlsSegmentPath = (
  videoId: string,
  segmentIndex: number | string
) => `/hls/${videoId}/${videoId}${segmentIndex}.ts`;

const dbDir = `${projectRoot}src/server/db/data/`;
export const accountsDbPath = `${dbDir}accounts.json`;
export const storeDbPath = `${dbDir}store.json`;
export const queuesDbPath = `${dbDir}queues.json`;
export const videosDbPath = `${dbDir}videos.json`;
