import { AlternateVideo, QueueItem } from "Viz";
import { QueuesDb } from "../server/db/QueuesDb";
import { VideosDb } from "../server/db/VideosDb";
import { youtube } from "../server/sources/youtube";

export async function onReplaceQueueItemVideo(
  queueItem: QueueItem,
  alternateVideo: AlternateVideo
) {
  const { id: oldVideoId, downloading } = VideosDb.getVideo(queueItem.videoId);
  const { id: newVideoId, thumbnail } = alternateVideo;
  // TODO const sourceUrl = `${sources[source].baseUrl}${videoId}`;
  const sourceUrl = `${youtube.baseUrl}${newVideoId}`;
  if (downloading) {
    await VideosDb.killVideoProcess(oldVideoId);
  }
  await VideosDb.addVideo({
    id: newVideoId,
    source: queueItem.video.source,
    sourceUrl,
    thumbnail,
    alternateVideos: queueItem.video.alternateVideos,
  });
  await QueuesDb.editItem(queueItem.id, {
    videoId: newVideoId,
  });
}
