export interface AppState {
  isLoggedIn: boolean,
  trackList: TrackList
  currentTrack: Track
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

export type PlayerNames = 'spotify'
export type SourceNames = 'youtube'

export type VizPrefs = {
  player: PlayerNames
  source: SourceNames
}

export type AuthState = {
  token: string
  refreshToken: string
}