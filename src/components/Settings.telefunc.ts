import { readdirSync, rmSync } from "fs";
import { VideosDb } from "../server/db/VideosDb";
import { hlsDir } from "../server/consts";
import { SettingsDb } from "../server/db/SettingsDb";
import { store } from "../store";

export async function onSaveSettings(settings: typeof store.settings) {
  SettingsDb.update({ settings });
}

export async function onDeleteVideos() {
  await SettingsDb.update({
    settings: {
      ...SettingsDb.settings,
      downloadQueueItems: false,
    },
  });
  await VideosDb.killVideoProcesses(VideosDb.processingVideoIds);

  // Wait until writing to videos db has completed
  await new Promise<void>((resolve) => {
    const waitForKilledProcesses = setInterval(() => {
      const noProcesses = Object.values(VideosDb.videos).every(
        (video) => !video.pid
      );

      if (noProcesses) {
        clearInterval(waitForKilledProcesses);
        resolve();
      }
    }, 250);
  });

  // Delete videos db
  await VideosDb.deleteDb();

  // Delete video files
  readdirSync(hlsDir).forEach((f) =>
    rmSync(`${hlsDir}/${f}`, { recursive: true })
  );
}
