import type { NewQueueItem, QueuePlaylistReference } from "Viz";
import { QueuesDb } from "../server/db/QueuesDb";

export async function onAddToQueue(
  queueId: string = QueuesDb.currentQueue.id,
  queueItems: NewQueueItem[],
  queuePlaylistReference: QueuePlaylistReference
) {
  await QueuesDb.addItems(queueId, queueItems);
  await QueuesDb.addPlaylist(queueId, queuePlaylistReference);
}
