import { JSONFilePreset } from "lowdb/node";
import { videosDbPath } from "../consts";
import type { Video, VideosDbType } from "Viz";

const videosDbDefault = {
  videos: {},
};
const videosDb = await JSONFilePreset<VideosDbType>(
  videosDbPath,
  structuredClone(videosDbDefault),
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

  async addVideo(props: Video) {
    this.videos[props.id] = props;
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
