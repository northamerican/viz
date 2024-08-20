import { videosDbName } from "../consts";
import type { AddVideoProps, Video, Videos } from "Viz";
import { processExists } from "process-exists";
import { VizEventPreset } from "./adapters/VizEventAdapter";

type VideosDbType = {
  videos: Videos;
};

const videosDbDefault = {
  videos: {},
};
const videosDb = await VizEventPreset<VideosDbType>(
  videosDbName,
  structuredClone(videosDbDefault)
);

export const VideosDb = {
  async read() {
    await videosDb.read();
  },

  get videos() {
    return videosDb.data.videos;
  },

  get processingVideoIds() {
    return Object.values(this.videos)
      .filter(({ pid }) => pid)
      .map(({ id }) => id);
  },

  getVideo(videoId: string) {
    return this.videos[videoId];
  },

  async killVideoProcess(videoId: string) {
    const pid = this.getVideo(videoId)?.pid;
    if (pid && (await processExists(pid))) {
      process.kill(pid, "SIGTERM");
      return Promise.resolve();
    }
  },

  async killVideoProcesses(videoIds: string[]) {
    await Promise.all(
      videoIds
        .filter((videoId) => this.videos[videoId].pid)
        .map((videoId) => this.killVideoProcess(videoId))
    );
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
