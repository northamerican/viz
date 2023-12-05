import { JSONPreset } from "lowdb/node";
import EventEmitter from 'node:events';
import { queuesDbPath } from "../consts";
import type { Queue, QueuesDbType, QueueItem, SegmentInfo, Video } from "Viz";
import { v4 as uuidv4 } from 'uuid';
import { VideosDb } from "./VideosDb";

const defaultUuid = uuidv4()
const queuesDbDefault: QueuesDbType = {
  state: {
    isPlaying: true,
    startTime: Date.now(),
    seekOffsetTime: 0,
  },
  currentQueueId: defaultUuid,
  queues: [{
    id: defaultUuid,
    totalDuration: 0,
    items: [],
    player: null,
    playlistId: null
  }]
}
const queuesDb = await JSONPreset<QueuesDbType>(queuesDbPath, queuesDbDefault)

export const QueuesDb = {
  get queues() {
    return queuesDb.data.queues
  },

  get currentQueueId() {
    return queuesDb.data.currentQueueId
  },

  get state() {
    return queuesDb.data.state
  },

  get currentQueue(): Queue {
    return this.getQueue(this.currentQueueId)
  },

  get currentQueueWithVideos(): Queue {
    return this.getQueueWithVideos(this.currentQueueId)
  },

  get currentQueueVideos(): Video[] {
    return this.currentQueueWithVideos.items.flatMap(item => item.video ?? [])
  },

  get currentQueueNotDownloaded() {
    return this.currentQueueWithVideos.items.filter(item => !item.video?.downloaded)
  },

  // Get next items for download
  downloadableQueue(max = 1): QueueItem[] {
    return this.currentQueueNotDownloaded.slice(0, max).filter(item => !item.video?.downloading)
  },

  // TODO cache this? may need to give each segment an id
  get currentQueueSegmentInfo(): SegmentInfo[] {
    return this.currentQueueVideos.flatMap(({ segmentDurations, id }) => {
      return segmentDurations.map((duration, segmentIndex) => ({
        segmentIndex,
        videoId: id,
        duration,
      }))
    })
  },

  get startTime() {
    return queuesDb.data.state.startTime
  },

  set startTime(timestamp: number) {
    queuesDb.data.state.startTime = timestamp
    this.write()
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

  editQueue(queueId: string, props: Omit<Partial<Queue>, 'items'>) {
    const queue = this.getQueue(queueId)
    Object.assign(queue, props)
    this.write()
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

  addItem(queueId: string, props: QueueItem) {
    this.addItems(queueId, [props])
    this.write()
  },

  addItems(queueId: string, items: Omit<QueueItem, 'id'>[]) {
    this.getQueue(queueId).items.push(...items.map(props => ({
      ...props,
      id: uuidv4()
    })))
    this.write()
  },

  removeItem(queueId: string, queueItemId: string) {
    this.removeItems(queueId, [queueItemId])
    this.write()
  },

  removeItems(queueId: string, queueItemIds: string[]) {
    this.getQueue(queueId).items = this.getQueue(queueId).items.filter(queueItem => !queueItemIds.includes(queueItem.id))
    this.write()
  },

  editItem(queueId: string, queueItemId: string, props: Partial<QueueItem>) {
    const queueItem = this.getItem(queueId, queueItemId)
    Object.assign(queueItem, props)
    this.write()
  },

  delete() {
    queuesDb.data = queuesDbDefault;
    this.write()
  },

  async write() {
    await queuesDb.write()
    queuesDbEvents.emit('update');
  },
}

export const queuesDbEvents = new EventEmitter();
