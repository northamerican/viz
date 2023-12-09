export const appPort = 1989;
// export const appIp = os.networkInterfaces().en0.find(({ family }) => family === 'IPv4').address
export const appIp = "192.168.68.109"
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
    playlist: (playlistId = ":playlistId") => `/api/playlists/${playlistId}`,
    videos: '/api/videos',
    video: '/api/video',
    m3u: '/api/m3u',
    ts: (videoId = ':videoId', segmentIndex: string | number = ':segmentIndex') => `/api/ts/${videoId}/${segmentIndex}`,
    play: '/api/play',
    queues: '/api/queues',
    queue: '/api/queue',
    queueDownload: '/api/queue/download',
    queueItem: (queueId = ':queueId', queueItemId = ':queueItemId') => `/api/queue/${queueId}/item/${queueItemId}`,
    queueId: (queueId = ':queueId') => `/api/queue/${queueId}`,
    current: '/api/queue/current',
    update: '/api/queue/update'
  }
}
