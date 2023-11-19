import { VideosDb } from "./VideosDb";

const m3u8Template = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:11
#EXT-X-START:TIME-OFFSET=0
#EXT-X-PLAYLIST-TYPE:LIVE\n`
const m3u8Discontinuity = '#EXT-X-DISCONTINUITY\n\n'

export class VizM3u8 {
  static buildM3u8() {
    const videos = VideosDb.getVideos()
    const tsSegments = videos.map(video => {
      const { id, segmentDurations } = video

      return segmentDurations.map((duration, index) => {
        return `#EXTINF:${duration},\n${id}/${id}${index}.ts\n`
      }).join('')
    }).join(m3u8Discontinuity)

    return `${m3u8Template}${tsSegments}`
  }
}
