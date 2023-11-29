export const appPort = 1989;
export const appIp = "192.168.68.115"
export const appUrl = `http://${appIp}:${appPort}/`;

const projectRoot = new URL(import.meta.url + "/../..").pathname;
export const mp4Dir = `${projectRoot}public/mp4/`;
export const hlsDir = `${projectRoot}public/hls/`;
export const tsPath = (videoId: string, segmentIndex: string | number) =>
  `${hlsDir}${videoId}/${videoId}${segmentIndex}.ts`;

const dbDir = `${projectRoot}src/db/`;
export const authDbPath = `${dbDir}auth.json`;
export const prefsDbPath = `${dbDir}prefs.json`;
export const queuesDbPath = `${dbDir}queues.json`;
export const videosDbPath = `${dbDir}videos.json`;

export const url = {
  authorize: '/authorize',
  token: '/token',
  api: {
    logout: '/api/logout',
    playlists: '/api/playlists',
    playlist: (playlistId: string) => `/api/playlists/${playlistId}`,
    video: '/api/video',
    m3u: '/api/m3u',
    ts: (videoId: string, segmentIndex: string | number) => `/api/ts/${videoId}/${segmentIndex}`,
    play: '/api/play',
    queue: '/api/queue',
    queueId: (queueId: string) => `/api/queue/${queueId}`,
    current: '/api/queue/current'
  }
}
