import { onMounted, onUnmounted } from 'vue'

export const mountWithInterval = (fn: any, interval: number) => {
  let mountInterval: NodeJS.Timeout
  onMounted(() => {
    fn()
    mountInterval = setInterval(() => {
      fn()
    }, interval)
  })

  onUnmounted(() => clearInterval(mountInterval))
}
