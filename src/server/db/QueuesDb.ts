import { JSONPreset } from "lowdb/node";
import { queuesDbPath } from "../consts";
import type { Queue, QueuesDbType, QueueItem, SegmentInfo, Video } from "Viz";
import { v4 as uuidv4 } from 'uuid';
import { VideosDb } from "./VideosDb";

const defaultUuid = uuidv4()
const queuesDbDefault: QueuesDbType = {
  state: {
    currentQueueId: defaultUuid,
    isPlaying: true,
    startTime: Date.now(),
    seekOffsetTime: 0,
  },
  queues: [{
    id: defaultUuid,
    totalDuration: null,
    items: [],
    playlist: null
  }]
}
const queuesDb = await JSONPreset<QueuesDbType>(queuesDbPath, queuesDbDefault)
await queuesDb.read()

export const QueuesDb = {
  async read() {
    await queuesDb.read()
  },

  get state() {
    return queuesDb.data.state
  },

  get queues() {
    return queuesDb.data.queues
  },

  get startTime() {
    return this.state.startTime
  },

  get currentQueue(): Queue {
    return this.getQueue(this.state.currentQueueId)
  },

  get currentQueueWithVideos(): Queue {
    return this.getQueueWithVideos(this.state.currentQueueId)
  },

  get currentQueueVideos(): Video[] {
    return this.currentQueueWithVideos.items.flatMap(item => item.video ?? [])
  },

  get currentQueueNotDownloaded() {
    return this.currentQueueWithVideos.items.filter(item => !item.video?.downloaded)
  },

  get currentQueueSegmentInfo(): SegmentInfo[] {
    return this.currentQueueVideos.flatMap(({ segmentDurations, id }) => {
      return segmentDurations.map((duration, segmentIndex) => ({
        segmentIndex,
        videoId: id,
        duration,
      }))
    })
  },

  get nextDownloadableInQueue(): QueueItem {
    const firstNotDownloaded = this.currentQueueNotDownloaded[0]
    return firstNotDownloaded.video?.downloading ? null : firstNotDownloaded
  },

  getQueue(queueId: string): Queue {
    return this.queues.find(({ id }) => id === queueId)
  },

  getQueueWithVideos(queueId: string): Queue {
    const queue = this.getQueue(queueId)
    const itemsWithVideos = queue.items.map(this.getItemWithVideo)

    return {
      ...queue,
      items: itemsWithVideos,
      totalDuration: itemsWithVideos.reduce((totalDuration, { video }) => {
        return totalDuration + (video?.duration || 0);
      }, 0)
    }
  },

  getItem(queueId: string, queueItemId: string): QueueItem {
    return this.getQueue(queueId).items.find(({ id }) => id === queueItemId)
  },

  getItemWithVideo(item: QueueItem): QueueItem {
    return {
      ...item,
      video: VideosDb.getVideo(item.videoId) || null
    }
  },

  async setStartTime(timestamp: number) {
    this.state.startTime = timestamp
    await queuesDb.write()
  },

  async editQueue(queueId: string, props: Omit<Partial<Queue>, 'items'>) {
    const queue = this.getQueue(queueId)
    Object.assign(queue, props)
    await queuesDb.write()
  },

  async addItem(queueId: string, props: QueueItem) {
    this.addItems(queueId, [props])
    await queuesDb.write()
  },

  async addItems(queueId: string, items: Omit<QueueItem, 'id'>[]) {
    this.getQueue(queueId).items.push(...items.map(props => ({
      ...props,
      id: uuidv4()
    })))
    await queuesDb.write()
  },

  async removeItem(queueId: string, queueItemId: string) {
    this.removeItems(queueId, [queueItemId])
    await queuesDb.write()
  },

  async removeItems(queueId: string, queueItemIds: string[]) {
    this.getQueue(queueId).items = this.getQueue(queueId).items.filter(queueItem => !queueItemIds.includes(queueItem.id))
    await queuesDb.write()
  },

  async editItem(queueId: string, queueItemId: string, props: Partial<QueueItem>) {
    const queueItem = this.getItem(queueId, queueItemId)
    Object.assign(queueItem, props)
    await queuesDb.write()
  },

  async deleteDb() {
    queuesDb.data = queuesDbDefault;
    await queuesDb.write()
  },
}