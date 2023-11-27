import { JSONPreset } from "lowdb/node";
import { join } from "path";
import { dbDir } from "./consts";
import type { QueueDbType, QueueItem } from "Viz";
import { v4 as uuidv4 } from 'uuid';

const defaultUuid = uuidv4()
const queueDb = await JSONPreset<QueueDbType>(join(dbDir, 'queue.json'), {
  startTime: 0,
  seekOffsetTime: 0,
  currentQueue: defaultUuid,
  queues: [{
    id: defaultUuid,
    items: []
  }]
})

const { currentQueue, queues } = queueDb.data

export const QueueDb = {
  get currentQueue() {
    return queues.find(queue => queue.id === currentQueue)
  },

  get data() {
    return queueDb.data
  },

  setStartTime() {
    queueDb.data.startTime = Date.now()
    queueDb.write()
  },

  getStartTime() {
    return queueDb.data.startTime
  },

  getQueues() {
    return queues
  },

  addItem(props: QueueItem) {
    this.currentQueue.items.push({
      ...props,
      id: uuidv4()
    })
    queueDb.write()
  },

  addItems(items: Omit<QueueItem, 'id'>[]) {
    this.currentQueue.items.push(...items.map(props => ({
      ...props,
      id: uuidv4()
    })))
    queueDb.write()
  }
}
