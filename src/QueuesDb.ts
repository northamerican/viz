import { JSONPreset } from "lowdb/node";
import { queuesDbPath } from "./consts";
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
    items: []
  }]
}
const queuesDb = await JSONPreset<QueuesDbType>(queuesDbPath, queuesDbDefault)
const { state, currentQueueId, queues } = queuesDb.data

export const QueuesDb = {
  get queues() {
    return queues
  },

  get state() {
    return state
  },

  get currentQueue(): Queue {
    return this.queues.find(queue => queue.id === currentQueueId)
  },

  get currentQueueWithVideos(): Queue {
    return {
      ...this.currentQueue,
      items: this.currentQueue.items.map(this.getItemWithVideo)
    }
  },

  get currentQueueVideos(): Video[] {
    return this.currentQueueWithVideos.items.flatMap(item => item.video ?? [])
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

  getQueue(queueId: string): Queue {
    return this.queues.find(({ id }) => id === queueId)
  },

  getQueueWithVideos(queueId: string): Queue {
    const queue = this.getQueue(queueId)
    return {
      ...queue,
      items: queue.items.map(this.getItemWithVideo)
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

  set startTime(timestamp: number) {
    queuesDb.data.state.startTime = timestamp
    queuesDb.write()
  },

  get startTime() {
    return queuesDb.data.state.startTime
  },

  addItem(props: QueueItem) {
    this.addItems([props])
    queuesDb.write()
  },

  addItems(items: Omit<QueueItem, 'id'>[]) {
    this.currentQueue.items.push(...items.map(props => ({
      ...props,
      id: uuidv4()
    })))
    queuesDb.write()
  },

  editItem(queueId: string, queueItemId: string, props: Partial<QueueItem>) {
    const queueItem = this.getItem(queueId, queueItemId)
    Object.assign(queueItem, props)
    queuesDb.write()
  }
}
