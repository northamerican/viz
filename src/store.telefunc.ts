import { AccountsDb } from "./server/db/AccountsDb";
import { QueuesDb } from "./server/db/QueuesDb";
import { SettingsDb } from "./server/db/SettingsDb";

export async function onGetSettings() {
  return SettingsDb.settings;
}

export async function onGetQueuesWithVideos() {
  return QueuesDb.queuesWithVideos;
}

export async function onGetAccountsAsArray() {
  return AccountsDb.accountsAsArray;
}
