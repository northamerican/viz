declare module "Viz" {
  export type VizStore = {
    videoEl: HTMLMediaElement;
    isLoggedIn: boolean;
    playlists: PlaylistList;
    queue: Queue;
    updateQueue: () => Promise<void>;
  };

  export type AuthState = {
    token: string;
    refreshToken?: string;
  };

  export type AuthStateDbType = {
    [player: string]: AuthState;
  };

  export type Track = {
    id: string;
    artists: string[];
    name: string;
    player: PlayerNames;
    playerUrl: string;
    addedAt: number;
  };

  export type PlaylistMeta = {
    id: string;
    name: string;
    player: PlayerNames;
  };

  export type Playlist = PlaylistMeta & {
    tracks: Track[];
  };

  export type PlaylistListItem = {
    id: string;
    name: string;
    total: number;
  };
  export type PlaylistList = {
    items: PlaylistListItem[];
    selected: Playlist;
  };

  export type SegmentInfo = {
    segmentIndex: number;
    videoId: string;
    duration: number;
  };

  export type Video = {
    id: string;
    source: SourceNames;
    sourceUrl: string;
    duration: number;
    downloading: boolean;
    downloaded: boolean;
    segmentDurations: number[];
  };
  export type Videos = {
    [id: string]: Video;
  };
  export type VideosDbType = {
    videos: Videos;
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

  export type QueuePlaylistReference = PlaylistMeta;

  export type Queue = {
    id: string;
    items: QueueItem[];
    totalDuration: number;
    playlist: QueuePlaylistReference;
  };
  export type QueuesDbType = {
    state: QueueState;
    queues: Queue[];
  };

  // export type QueuesList = {
  //   queues: []
  //   selected: Queue
  // }

  export type PlayerNames = "spotify";
  export type SourceNames = "youtube";

  export type VizPrefsDbType = {
    player: PlayerNames;
    source: SourceNames;
  };
}
