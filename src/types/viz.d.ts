declare module "Viz" {
  export type AppState = {
    isLoggedIn: boolean
    playlists: PlaylistList
    selectedPlaylist: Playlist
    queue: Queue
  }

  export type AuthStateDbType = {
    token: string
    refreshToken: string
  }

  export type Track = {
    id: string
    artists: string[]
    title: string // TODO change to name
    player: PlayerNames
  }

  export type Playlist = {
    id: string
    name: string
    tracks: Track[]
  }

  export type PlaylistListItem = {
    id: string
    name: string
    total: number
  }
  export type PlaylistList = {
    items: PlaylistListItem[]
  }

  export type Video = {
    id: string
    source: SourceNames
    duration: number,
    segmentDurations: number[]
  }
  export type Videos = {
    [id: string]: Video
  }
  export type VideosDbType = {
    startTime: number,
    videos: Videos
  }

  export type QueueItem = {
    id: string
    track: Track
    videoId: string
    downloaded: boolean
  }
  export type Queue = {
    id: string,
    items: QueueItem[]
  }
  export type QueueDbType = {
    startTime: number,
    seekOffsetTime: number,
    currentQueue: string
    queues: Queue[]
  }

  export type PlayerNames = 'spotify'
  export type SourceNames = 'youtube'

  export type VizPrefsDbType = {
    player: PlayerNames
    source: SourceNames
  }
}