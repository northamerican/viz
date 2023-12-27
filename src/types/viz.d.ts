declare module "Viz" {
  export type VizStore = {
    videoEl: any
    isLoggedIn: boolean
    playlists: PlaylistList
    selectedPlaylist: Playlist
    // TODO currentQueue
    queue: Queue
    updateQueue: () => Promise<void>
  }

  export type AuthState = {
    token: string
    refreshToken?: string
  }

  export type AuthStateDbType = {
    [player: string]: AuthState
  }

  // TODO type TrackId = string ..
  export type Track = {
    id: string
    artists: string[]
    name: string
    player: PlayerNames
    playerUrl: string
    addedAt: number
  }

  export type Playlist = {
    id: string
    name: string
    tracks: Track[]
    player: PlayerNames
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
    currentQueueId: string
    isPlaying: boolean
    startTime: number
    seekOffsetTime: number
  }
  export type QueueItem = {
    id: string
    track: Track
    videoId: string
    video?: Video
  }

  export type QueuePlaylistReference = Omit<Playlist, 'tracks'>

  export type Queue = {
    id: string,
    items: QueueItem[]
    totalDuration: number
    playlist: QueuePlaylistReference
  }
  export type QueuesDbType = {
    state: QueueState
    queues: Queue[]
  }

  export type PlayerNames = 'spotify'
  export type SourceNames = 'youtube'

  export type VizPrefsDbType = {
    player: PlayerNames
    source: SourceNames
  }
}