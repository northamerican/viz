import { JSONPreset } from "lowdb/node";
import { Video, Videos } from "./types/viz";
import { dbDir } from "./consts";

const videosDb = await JSONPreset<{ videos: Videos }>(`${dbDir}videos.json`, {
  videos: []
})

const { videos } = videosDb.data

export class VideosDb {
  static getVideos() {
    return videos
  }

  static getVideo(videoId: string) {
    return videos.find(({ id }) => id === videoId)
  }

  static addVideo(video: Video) {
    videos.push(video)
    videosDb.write()
  }

  static editVideo(videoId: string, props: Partial<Video>) {
    const video = this.getVideo(videoId)

    Object.assign(video, props)
    videosDb.write()
  }
}