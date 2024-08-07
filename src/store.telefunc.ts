import { AccountsDb } from "./server/db/AccountsDb";
import { vizEventEmitter } from "./server/db/adapter/VizEventAdapter";
import { QueuesDb } from "./server/db/QueuesDb";
import { StoreDb } from "./server/db/StoreDb";

export async function onServerEvent(eventName: string) {
  return new Promise((resolve) => {
    vizEventEmitter.once(eventName, resolve);
  });
}

export async function onGetSettings() {
  return StoreDb.settings;
}

export async function onGetQueuesWithVideos() {
  return QueuesDb.queuesWithVideos;
}

export async function onGetAccountsAsArray() {
  return AccountsDb.accountsAsArray;
}
