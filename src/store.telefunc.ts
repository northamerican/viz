import { AccountsDb } from "./server/db/AccountsDb";
import { QueuesDb } from "./server/db/QueuesDb";
import { StoreDb } from "./server/db/StoreDb";

export async function onGetSettings() {
  return StoreDb.settings;
}

export async function onGetQueuesWithVideos() {
  return QueuesDb.queuesWithVideos;
}

export async function onGetAccountsAsArray() {
  return AccountsDb.accountsAsArray;
}
