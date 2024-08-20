import { eventsPath, serverEventNames } from "./consts";
import { store } from "./store";
import type { VizStoreMethods } from "./types/VizStore";

const serverEventMap: {
  [EventName in (typeof serverEventNames)[number]]: keyof VizStoreMethods;
} = {
  "accounts:write": "updateAccounts",
  "store:write": "updateSettings",
  "queues:write": "updateQueues",
  "videos:write": "updateQueues",
};

const eventSource = new EventSource(eventsPath);

export function vizEventListener() {
  // Listen for server events, call store method
  Object.entries(serverEventMap).map(([eventName, storeMethod]) => {
    eventSource.addEventListener(eventName, () => store[storeMethod]());
  });

  return eventSource;
}
