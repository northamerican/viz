import { eventsPath, serverEventNames } from "./consts";
import { store } from "./store";
import type { VizStoreMethods } from "./types/VizStore";

type ServerEventMap = {
  [EventName in (typeof serverEventNames)[number]]: keyof VizStoreMethods;
};

const serverEventMap: ServerEventMap = {
  "accounts:write": "updateAccounts",
  "store:write": "updateSettings",
  "queues:write": "updateQueues",
  "videos:write": "updateQueues",
};

const eventSource = new EventSource(eventsPath);

// Listen for server events, call store method
export function vizEventListener() {
  Object.entries(serverEventMap).map(([eventName, storeMethod]) => {
    eventSource.addEventListener(eventName, () => store[storeMethod]());
  });

  return eventSource;
}
