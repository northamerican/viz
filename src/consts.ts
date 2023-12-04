export const appPort = 1989;
// export const appIp = "compluter.local"
export const appIp = "192.168.68.115"
export const appUrl = `http://${appIp}:${appPort}/`;

const projectRoot = new URL(import.meta.url + "/../..").pathname;
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
    videos: '/api/videos',
    video: '/api/video',
    m3u: '/api/m3u',
    ts: (videoId: string, segmentIndex: string | number) => `/api/ts/${videoId}/${segmentIndex}`,
    play: '/api/play',
    queues: '/api/queues',
    queue: '/api/queue',
    queueId: (queueId: string) => `/api/queue/${queueId}`,
    queueDownload: '/api/queue/download',
    current: '/api/queue/current',
    update: '/api/queue/update'
  }
}
