import { VizStore } from "Viz"
import { getCookie } from "typescript-cookie"
import { reactive } from "vue"
import { loggedInCookie } from "./consts"
import { onUpdateQueueWithVideo } from "./components/Queue.telefunc"

export const store = reactive<VizStore>({
  videoEl: null,
  isLoggedIn: !!getCookie(loggedInCookie),
  playlists: {
    selected: null,
    items: []
  },
  queue: null,
  async updateQueue() {
    this.queue = await onUpdateQueueWithVideo()
  }
})