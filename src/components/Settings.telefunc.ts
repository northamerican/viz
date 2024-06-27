import { readdirSync, rmSync } from "fs";
import { VideosDb } from "../server/db/VideosDb";
import { hlsDir } from "../server/consts";

export async function onDeleteVideos() {
  VideosDb.deleteDb();
  readdirSync(hlsDir).forEach((f) =>
    rmSync(`${hlsDir}/${f}`, { recursive: true })
  );
}
