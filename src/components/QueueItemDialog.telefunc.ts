import { AlternateVideo, QueueItem } from "Viz";
import { QueuesDb } from "../server/db/QueuesDb";
import { onDownloadVideo } from "./Queue.telefunc";
import { VideosDb } from "../server/db/VideosDb";
import { youtube } from "../server/sources/youtube";
import { store } from "../store";

export async function onReplaceQueueItemVideo(
  queueItem: QueueItem,
  alternateVideo: AlternateVideo
) {
  const { downloading, pid } = VideosDb.getVideo(queueItem.videoId);
  const { id: videoId, thumbnail } = alternateVideo;
  const sourceUrl = `${youtube.baseUrl}${videoId}`;
  // const sourceUrl = `${sources[source].baseUrl}${videoId}`;
  if (downloading) {
    process.kill(pid, "SIGTERM");
  }
  await VideosDb.addVideo({
    id: videoId,
    source: queueItem.video.source,
    sourceUrl,
    thumbnail,
    alternateVideos: queueItem.video.alternateVideos,
  });
  await QueuesDb.editItem(queueItem.id, { videoId });
  await onDownloadVideo(videoId, sourceUrl);
  store.updateQueues();
}
