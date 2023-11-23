import { JSONPreset } from "lowdb/node";
import { join } from "path";
import { dbDir } from "./consts";
import type { Video, Videos } from "Viz";

const videosDb = await JSONPreset<{ videos: Videos }>(join(dbDir, 'videos.json'), {
  videos: []
})

const { videos } = videosDb.data

export const VideosDb = {
  getVideos() {
    return videos
  },

  getVideo(videoId: string) {
    return videos.find(({ id }) => id === videoId)
  },

  addVideo(video: Video) {
    videos.push(video)
    videosDb.write()
  },

  editVideo(videoId: string, props: Partial<Video>) {
    const video = this.getVideo(videoId)

    Object.assign(video, props)
    videosDb.write()
  }
}