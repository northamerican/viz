declare module "Viz" {
  export type AppState = {
    videoEl: any
    isLoggedIn: boolean
    playlists: PlaylistList
    selectedPlaylist: Playlist
    queue: Queue
    // currentQueue
  }

  export type AuthState = {
    token: string
    refreshToken?: string
  }

  export type AuthStateDbType = {
    [player: string]: AuthState
  }

  export type Track = {
    id: string
    artists: string[]
    name: string
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

  export type SegmentInfo = {
    segmentIndex: number;
    videoId: string;
    duration: number;
  }

  export type Video = {
    id: string
    source: SourceNames
    sourceUrl: string,
    duration: number,
    downloading: boolean
    downloaded: boolean
    segmentDurations: number[]
  }
  export type Videos = {
    [id: string]: Video
  }
  export type VideosDbType = {
    videos: Videos
  }

  export type QueueState = {
    isPlaying: boolean
    startTime: number,
    seekOffsetTime: number,
  }
  export type QueueItem = {
    id: string
    track: Track
    videoId: string
    video?: Video
  }
  export type Queue = {
    id: string,
    items: QueueItem[]
    // TODO use this for fetching new tracks from playlist
    // and updating queue with new tracks
    // playlistId: string
  }
  export type QueuesDbType = {
    state: QueueState
    currentQueueId: string
    queues: Queue[]
  }

  export type PlayerNames = 'spotify'
  export type SourceNames = 'youtube'

  export type VizPrefsDbType = {
    player: PlayerNames
    source: SourceNames
  }
}