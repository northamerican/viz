import { VizStore } from "Viz"
import { getCookie } from "typescript-cookie"
import { reactive } from "vue"
import { loggedInCookie } from "./consts"
import { onUpdateQueueWithVideo } from "./server/queue.telefunc"

export const store = reactive<VizStore>({
  videoEl: null,
  isLoggedIn: !!getCookie(loggedInCookie),
  playlists: {
    items: []
  },
  selectedPlaylist: null,
  queue: null,
  async updateQueue() {
    this.queue = await onUpdateQueueWithVideo()
  }
})