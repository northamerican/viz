import { queuesDbName } from "../consts";
import type {
  Queue,
  QueueItem,
  SegmentInfo,
  Video,
  QueuePlaylistReference,
  QueueWithVideos,
  NewQueueItem,
} from "Viz";
import { v4 as uuidv4 } from "uuid";
import { VideosDb } from "./VideosDb";
import { vizIntroQueueItem } from "./fixtures/queues";
import { VizEventPreset } from "./adapters/VizEventAdapter";

type QueuesDbType = {
  queues: Queue[];
};

const queueItemsDefault = () => structuredClone([vizIntroQueueItem]);
const queuesDbDefault: QueuesDbType = {
  queues: [
    {
      id: uuidv4(),
      name: "Queue 1",
      active: true,
      startTime: Date.now(),
      items: queueItemsDefault(),
      playlists: [],
    },
  ],
};

const queuesDb = await VizEventPreset<QueuesDbType>(
  queuesDbName,
  queuesDbDefault
);

export const QueuesDb = {
  async read() {
    await queuesDb.read();
  },

  get queues() {
    return queuesDb.data.queues;
  },

  get queuesWithVideos() {
    return this.queues.map(({ id }) => this.getQueueWithVideos(id));
  },

  get activeQueue(): Queue {
    return this.queues.find(({ active }) => active);
  },

  get activeQueueWithVideos(): QueueWithVideos {
    return this.getQueueWithVideos(this.activeQueue.id);
  },

  get activeQueueSegmentInfo(): SegmentInfo[] {
    const activeQueueVideos = this.activeQueueWithVideos.items.flatMap(
      (item) => item.video ?? []
    ) as Video[];
    return activeQueueVideos.flatMap(({ segmentDurations, id }) => {
      return segmentDurations.map((duration, segmentIndex) => ({
        segmentIndex,
        videoId: id,
        duration,
      }));
    });
  },

  get nextDownloadableInQueue(): QueueItem {
    const firstNotDownloaded = this.activeQueueWithVideos.items.find(
      (item) => !item.video?.downloaded && !item.video?.error && !item.error
    );
    // Return QueueItem only if it's idle / not downloading.
    return firstNotDownloaded?.video?.downloading ? null : firstNotDownloaded;
  },

  getQueue(queueId: string): Queue {
    return this.queues.find(({ id }) => id === queueId);
  },

  getQueueWithVideos(queueId: string): QueueWithVideos {
    const queue = this.getQueue(queueId);
    const itemsWithVideos = queue.items
      .filter((item) => !item.removed)
      .map(this.getItemWithVideo);

    return {
      ...queue,
      items: itemsWithVideos,
      totalDuration: itemsWithVideos.reduce((totalDuration, { video }) => {
        return totalDuration + (video?.duration || 0);
      }, 0),
    };
  },

  getItem(queueItemId: string): QueueItem {
    return this.queues
      .flatMap(({ items }) => items)
      .find(({ id }) => id === queueItemId);
  },

  getItemWithVideo(item: QueueItem): QueueItem {
    return {
      ...item,
      video: VideosDb.getVideo(item.videoId) || null,
    };
  },

  async playQueue(queueId: string) {
    await queuesDb.update(() => {
      this.queues.forEach((queue) => {
        const isTargetQueue = queueId === queue.id;
        queue.active = isTargetQueue;
        if (isTargetQueue) {
          queue.startTime = Date.now();
        }
      });
    });
  },

  async clearQueue(queueId: string) {
    const queue = this.getQueueWithVideos(queueId);
    const videoIds = queue.items.flatMap(({ video }) => video?.id ?? []);

    await VideosDb.killVideoProcesses(videoIds);
    await queuesDb.update(() => {
      Object.assign(this.getQueue(queueId), {
        startTime: Date.now(),
        items: queueItemsDefault(),
        playlists: [],
      });
    });
  },

  async addPlaylist(queueId: string, newPlaylist: QueuePlaylistReference) {
    await queuesDb.update(() => {
      const queue = this.getQueue(queueId);
      const existingPlaylist = queue.playlists.find(
        (playlist) => playlist.id === newPlaylist.id
      );
      if (existingPlaylist) return;
      queue.playlists.push(newPlaylist);
    });
  },

  async editPlaylist(
    queueId: string,
    playlistId: string,
    props: Pick<QueuePlaylistReference, "updatesQueue">
  ) {
    await queuesDb.update(() => {
      const queue = this.getQueue(queueId);
      const playlist = queue.playlists.find(({ id }) => playlistId === id);
      Object.assign(playlist, props);
    });
  },

  async removePlaylist(queueId: string, playlistId: string) {
    await queuesDb.update(() => {
      const queue = this.getQueue(queueId);
      queue.playlists = queue.playlists.filter(
        (playlist) => playlist.id !== playlistId
      );
    });
  },

  async addItem(queueId: string, props: QueueItem) {
    this.addItems(queueId, [props]);
  },
  async addItems(queueId: string, items: NewQueueItem[]) {
    this.getQueue(queueId).items.push(
      ...items.map((props) => ({
        ...props,
        id: uuidv4(),
      }))
    );
    await queuesDb.write();
  },

  async editItem(queueItemId: string, props: Partial<QueueItem>) {
    this.editItems([queueItemId], props);
  },
  async editItems(queueItemIds: string[], props: Partial<QueueItem>) {
    queueItemIds.forEach((queueItemId) => {
      const queueItem = this.getItem(queueItemId);
      Object.assign(queueItem, props);
    });
    await queuesDb.write();
  },

  async removeItem(queueItemId: string) {
    this.editItem(queueItemId, { removed: true });
    const { videoId } = this.getItem(queueItemId);
    VideosDb.killVideoProcess(videoId);
  },

  async deleteDb() {
    await queuesDb.update(() => {
      queuesDb.data = structuredClone(queuesDbDefault);
    });
  },
};
