import { JSONPreset } from "lowdb/node";
import { join } from "path";
import { dbDir } from "./consts";
import type { Video, VideosDbType } from "Viz";

const videosDb = await JSONPreset<VideosDbType>(join(dbDir, 'videos.json'), {
  startTime: 0,
  videos: []
})

const { videos } = videosDb.data

export const VideosDb = {
  setStartTime() {
    videosDb.data.startTime = Date.now()
    videosDb.write()
  },

  getStartTime() {
    return videosDb.data.startTime
  },

  getVideos() {
    return videos
  },

  getVideo(videoId: string) {
    return videos.find(({ id }) => id === videoId)
  },

  addVideo(props: Video) {
    const existingVideo = this.getVideo(props.id)
    if (existingVideo) {
      return this.editVideo(existingVideo, props)
    }

    videos.push(props)
    videosDb.write()
  },

  editVideo(video: Video, props: Partial<Video>) {
    Object.assign(video, props)
    videosDb.write()
  }
}