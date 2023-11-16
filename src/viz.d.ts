export type Track = {
  id: string
  artist: string
  title: string
}

export type TrackList = Track[]

export interface AppState {
  token: string

  trackList: TrackList
  currentTrack: Track
}