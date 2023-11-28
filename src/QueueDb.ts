import { JSONPreset } from "lowdb/node";
import { join } from "path";
import { dbDir } from "./consts";
import type { Queue, QueueDbType, QueueItem } from "Viz";
import { v4 as uuidv4 } from 'uuid';
import { VideosDb } from "./VideosDb";

const defaultUuid = uuidv4()
// TODO queue.json and other db filenames into consts
const queueDb = await JSONPreset<QueueDbType>(join(dbDir, 'queue.json'), {
  startTime: 0,
  seekOffsetTime: 0,
  currentQueueId: defaultUuid,
  queues: [{
    id: defaultUuid,
    items: []
  }]
})

const { currentQueueId, queues, startTime } = queueDb.data

export const QueueDb = {
  get queues() {
    return queues
  },

  get data() {
    return queueDb.data
  },

  get startTime() {
    return startTime
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

  setStartTime() {
    queueDb.data.startTime = Date.now()
    queueDb.write()
  },

  addItem(props: QueueItem) {
    this.addItems([props])
    queueDb.write()
  },

  addItems(items: Omit<QueueItem, 'id'>[]) {
    this.currentQueue.items.push(...items.map(props => ({
      ...props,
      id: uuidv4()
    })))
    queueDb.write()
  },

  editItem(queueId: string, queueItemId: string, props: Partial<QueueItem>) {
    const queueItem = this.getItem(queueId, queueItemId)
    Object.assign(queueItem, props)
    queueDb.write()
  }
}
