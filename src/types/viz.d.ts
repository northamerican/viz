declare module "Viz" {
  export type AppState = {
    isLoggedIn: boolean
    trackList: TrackList
    currentTrack: Track
    playlists: any
    selectedPlaylist: any
  }

  export type AuthStateDbType = {
    token: string
    refreshToken: string
  }

  export type Track = {
    id: string
    artists: string[]
    title: string // TODO change to name ?
    durationMs: number
    progressMs: number
    shuffleState: boolean
    isPlaying: boolean
  }
  export type TrackList = Track[]

  export type Playlist = {
    id: string
    name: string
    tracks: Partial<Track>[]
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
  export type Videos = Video[]

  export type VideosDbType = {
    startTime: number,
    videos: Videos
  }

  export type PlayerNames = 'spotify'
  export type SourceNames = 'youtube'

  export type VizPrefsDbType = {
    player: PlayerNames
    source: SourceNames
  }
}