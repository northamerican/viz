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

  /** Account with tokens */
  export type AccountDbItem = AccountBase & {
    token: string;
    refreshToken?: string;
  };

  export type ItemType = "track" | "interstitial" | "videoContent";

  export type Track = {
    id: string;
    artists: string[];
    name: string;
    player: PlayerId;
    playerUrl: string;
    videoId?: string;
    addedAt: number;
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

  export type AlternateVideo = {
    name: string;
    author: string;
    id: string;
    thumbnail: {
      url: string;
      width: number;
      height: number;
    };
  };

  export type VideoThumbnail = {
    url: string;
    width: number;
    height: number;
  };

  export type Video = {
    id: string;
    source: "youtube";
    sourceUrl: string;
    duration: number;
    segmentDurations: number[];
    alternateVideos: AlternateVideo[];
    thumbnail: VideoThumbnail;
    downloading: boolean;
    downloaded: boolean;
    error: string;
    pid?: number;
  };

  export type AddVideoProps = Pick<
    Video,
    "id" | "source" | "sourceUrl" | "thumbnail" | "alternateVideos"
  >;

  export type VideoInfo = {
    videoId: string;
    url: string;
    thumbnail: VideoThumbnail;
    alternateVideos: Video["alternateVideos"];
  };

  export type Videos = {
    [id: string]: Video;
  };

  export type QueueItem = {
    id: string;
    track: Track;
    videoId: string;
    video?: Video;
    removed: boolean;
    error?: string;
    playlistId: string;
    type: ItemType;
  };
  export type NewQueueItem = Omit<QueueItem, "id">;

  export type QueueItemWithVideo = Required<QueueItem, "video">;

  export type QueuePlaylistReference = {
    id: string;
    name: string;
    player: PlayerId;
    account: Omit<AccountBase, "isLoggedIn">;
    updatesQueue: boolean;
    type: ItemType;
  };

  export type Queue = {
    id: string;
    name: string;
    active: boolean;
    startTime: number;
    items: QueueItem[];
    playlists: QueuePlaylistReference[];
  };

  export type QueueWithVideos = Queue & {
    totalDuration: number;
    items: QueueItemWithVideo[];
  };
}
