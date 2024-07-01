import { readdirSync, rmSync } from "fs";
import { VideosDb } from "../server/db/VideosDb";
import { hlsDir } from "../server/consts";
import { StoreDb } from "../server/db/StoreDb";
import { store } from "../store";

export async function onSaveSettings(settings: typeof store.settings) {
  StoreDb.update({ settings });
}

export async function onDeleteVideos() {
  VideosDb.deleteDb();
  readdirSync(hlsDir).forEach((f) =>
    rmSync(`${hlsDir}/${f}`, { recursive: true })
  );
}
