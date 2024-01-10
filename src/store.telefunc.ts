import { AccountsDb } from "./server/db/AccountsDb";
import { QueuesDb } from "./server/db/QueuesDb";
import { StoreDb } from "./server/db/StoreDb";
import { PersistedVizStore } from "./types/VizStore";

export async function onSaveStore(storeData: PersistedVizStore) {
  return StoreDb.update(storeData);
}

export async function onUpdateStore() {
  return StoreDb.data;
}

export async function onUpdateQueueStore() {
  return QueuesDb.currentQueueWithVideos;
}

export async function onUpdateAccountsStore() {
  return Object.values(AccountsDb.accounts).map(
    ({ id, player, isLoggedIn, displayName, profileUrl }) => ({
      id,
      player,
      isLoggedIn,
      displayName,
      profileUrl,
      playlists: null,
    })
  );
}
