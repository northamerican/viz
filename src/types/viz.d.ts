declare module "Viz" {
  import { PlayerId } from "./VizPlayer";

  export type AccountBase = {
    id: string;
    displayName: string;
    player: PlayerId;
    isLoggedIn: boolean;
    profileUrl: string;
  };

  export type Account = AccountBase & {
    playlists: Playlists;
  };

  export type AccountDbItem = AccountBase & {
    token: string;
    refreshToken?: string;
  };

  export type TrackType = "track" | "interstitial" | "videoContent";

  export type Track = {
    id: string;
    artists: string[];
    name: string;
    player: PlayerId;
    playerUrl: string;
    addedAt: number;
    type: TrackType;
  };

  export type Playlists = {
    items: PlaylistSummary[];
  };

  export type PlaylistSummary = {
    id: string;
    name: string;
    total: number;
  };

  export type PlaylistMeta = {
    id: string;
    name: string;
    player: PlayerId;
    account: AccountBase;
  };

  export type Playlist = PlaylistMeta & {
    tracks: Track[];
  };

  export type SegmentInfo = {
    segmentIndex: number;
    videoId: string;
    duration: number;
  };

  export type Video = {
    id: string;
    source: unknown; // TODO define
    sourceUrl: string;
    duration: number;
    downloading: boolean;
    downloaded: boolean;
    segmentDurations: number[];
  };

  export type Videos = {
    [id: string]: Video;
  };

  export type QueueState = {
    currentQueueId: string;
    isPlaying: boolean;
    startTime: number;
    seekOffsetTime: number;
  };
  export type QueueItem = {
    id: string;
    track: Track;
    videoId: string;
    video?: Video;
    removed: boolean;
  };

  export type QueuePlaylistReference = PlaylistMeta & {
    updatesQueue: boolean;
    trackType: TrackType;
  };

  export type Queue = {
    id: string;
    items: QueueItem[];
    totalDuration: number;
    playlist: QueuePlaylistReference;
  };

  // export type QueuesList = {
  //   queues: []
  //   selected: Queue
  // }
}
