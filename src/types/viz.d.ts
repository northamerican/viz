declare module "Viz" {
  export type AppState = {
    isLoggedIn: boolean
    trackList: TrackList
    currentTrack: Track
  }

  export type AuthStateDbType = {
    token: string
    refreshToken: string
  }

  export type Track = {
    id: string
    artist: string
    title: string
    durationMs: number
    progressMs: number
    shuffleState: boolean
    isPlaying: boolean
  }
  export type TrackList = Track[]

  export type Video = {
    id: string
    source: SourceNames
    duration: number,
    segmentDurations: string[]
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