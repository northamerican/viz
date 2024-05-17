import { JSONFilePreset } from "lowdb/node";
import { videosDbPath } from "../consts";
import type { Video, Videos } from "Viz";

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

  async addVideo(props: Pick<Video, "id" | "source" | "sourceUrl">) {
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
