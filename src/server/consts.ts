const remotePort = +process.env.REMOTE_PORT;
const remoteHost = process.env.REMOTE_HOST;
const localPort = +process.env.LOCAL_PORT;
const localHost = process.env.LOCAL_HOST;
const isLocal = process.argv.includes("--local");
export const appPort = isLocal ? localPort : remotePort;
export const appHost = isLocal ? localHost : remoteHost;
export const appUrl = `http://${appHost}:${appPort}/`;

export const projectRoot = new URL(import.meta.url + "/../../..").pathname;
export const hlsDir = `${projectRoot}public/hls/`;
export const tsPath = (
  videoId = ":videoId",
  segmentIndex: string | number = ":segmentIndex",
) => `/hls/${videoId}/${videoId}${segmentIndex}.ts`;

const dbDir = `${projectRoot}src/server/db/data/`;
export const authDbPath = `${dbDir}auth.json`;
export const prefsDbPath = `${dbDir}prefs.json`;
export const queuesDbPath = `${dbDir}queues.json`;
export const videosDbPath = `${dbDir}videos.json`;
