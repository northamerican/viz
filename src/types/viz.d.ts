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
    videoId?: string;
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
    segmentDurations: number[];
    downloading: boolean;
    downloaded: boolean;
    error: string;
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
    error?: string;
  };

  export type QueuePlaylistReference = {
    id: string;
    name: string;
    player: PlayerId;
    account: AccountBase; // TODO this has tokens in it. just store account id
    updatesQueue: boolean;
    type: TrackType;
  };

  export type Queue = {
    id: string;
    items: QueueItem[];
    totalDuration: number;
    playlists: QueuePlaylistReference[];
  };

  export type QueueWithVideos = Queue & {
    items: Required<QueueItem, "video">[];
  };

  // export type QueuesList = {
  //   queues: []
  //   selected: Queue
  // }
}
