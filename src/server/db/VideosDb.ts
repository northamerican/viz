import { JSONFilePreset } from "lowdb/node";
import { videosDbPath } from "../consts";
import type { AddVideoProps, Video, Videos } from "Viz";
import { processExists } from "process-exists";

type VideosDbType = {
  videos: Videos;
};

const videosDbDefault = {
  videos: {},
};
const videosDb = await JSONFilePreset<VideosDbType>(
  videosDbPath,
  structuredClone(videosDbDefault)
);
await videosDb.read();

export const VideosDb = {
  async read() {
    await videosDb.read();
  },

  get videos() {
    return videosDb.data.videos;
  },

  getVideo(videoId: string) {
    return this.videos[videoId];
  },

  async killVideoProcess(videoId: string) {
    const { pid } = this.getVideo(videoId);
    if (pid && (await processExists(pid))) {
      process.kill(pid, "SIGTERM");
    }
  },

  killAllVideoProcesses() {
    Object.values(this.videos)
      .filter((video) => video.pid)
      .map((video) => this.killVideoProcess(video.id));
  },

  async clearDownloading() {
    Object.values(this.videos).forEach((video) => {
      Object.assign(video, {
        downloading: false,
        pid: null,
      });
    });
    await videosDb.write();
  },

  async addVideo(props: AddVideoProps) {
    this.videos[props.id] = {
      duration: 0,
      segmentDurations: [],
      downloaded: false,
      downloading: true,
      error: null,
      ...props,
    };
    await videosDb.write();
  },

  async editVideo(videoId: string, props: Partial<Video>) {
    Object.assign(this.getVideo(videoId), props);
    await videosDb.write();
  },

  async deleteDb() {
    videosDb.data = structuredClone(videosDbDefault);
    await videosDb.write();
  },
};
