import { JSONPreset } from "lowdb/node";
import { videosDbPath } from "../consts";
import EventEmitter from 'node:events';
import type { Video, VideosDbType } from "Viz";
import { queuesDbEvents } from "./QueuesDb";

const videosDbDefault = {
  videos: {}
}
const videosDb = await JSONPreset<VideosDbType>(videosDbPath, videosDbDefault)

export const VideosDb = {
  get videos() {
    return videosDb.data.videos
  },

  getVideo(videoId: string) {
    return this.videos[videoId]
  },

  addVideo(props: Video) {
    this.videos[props.id] = props
    this.write()
  },

  editVideo(videoId: string, props: Partial<Video>) {
    Object.assign(this.getVideo(videoId), props)
    this.write()
  },

  delete() {
    videosDb.data = videosDbDefault;
    this.write()
  },

  async write() {
    await videosDb.write()
    videosDbEvents.emit('update');
    queuesDbEvents.emit('update');
  },
}

export const videosDbEvents = new EventEmitter();

