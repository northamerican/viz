import type { NewQueueItem, QueuePlaylistReference } from "Viz";
import { QueuesDb } from "../server/db/QueuesDb";

export async function onAddItemsToQueue(
  queueId: string = QueuesDb.activeQueue.id,
  queueItems: NewQueueItem[]
) {
  await QueuesDb.addItems(queueId, queueItems);
}

export async function onAddPlaylistToQueue(
  queueId: string = QueuesDb.activeQueue.id,
  queuePlaylistReference: QueuePlaylistReference
) {
  await QueuesDb.addPlaylist(queueId, queuePlaylistReference);
}
