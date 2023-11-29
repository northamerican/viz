import { JSONPreset } from "lowdb/node";
import { videosDbPath } from "../consts";
import type { Video, VideosDbType } from "Viz";

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
    videosDb.write()
  },

  editVideo(videoId: string, props: Partial<Video>) {
    Object.assign(this.getVideo(videoId), props)
    videosDb.write()
  }
}