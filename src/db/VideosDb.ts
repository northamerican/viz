import { JSONPreset } from "lowdb/node";
import { videosDbPath } from "../consts";
import EventEmitter from 'node:events';
import type { Video, VideosDbType } from "Viz";
import { queuesDbEvents } from "./QueuesDb";

const videosDbDefault = {
  videos: {}
}
const videosDb = await JSONPreset<VideosDbType>(videosDbPath, videosDbDefault)
const { videos } = videosDb.data

export const VideosDb = {
  getVideos() {
    return videos
  },

  getVideo(videoId: string) {
    return videos[videoId]
  },

  addVideo(props: Video) {
    videos[props.id] = props
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

