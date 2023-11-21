import { VideosDb } from "./VideosDb";
import { join } from "path";

const m3u8Template = `#EXTM3U
#EXT-X-VERSION:6
#EXT-X-TARGETDURATION:9999999
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-START:TIME-OFFSET=0
#EXT-X-PLAYLIST-TYPE:EVENT
#EXT-X-DISCONTINUITY\n`

//   `#EXTM3U
// #EXT-X-VERSION:3
// #EXT-X-TARGETDURATION:10
// #EXT-X-MEDIA-SEQUENCE:0`

// #EXT-X-INDEPENDENT-SEGMENTS

// `${(new Date).toISOString()}`

const m3u8Discontinuity = '#EXT-X-DISCONTINUITY\n'

export class VizM3u8 {
  static buildM3u8() {
    const videos = VideosDb.getVideos()
    const tsSegments = videos.map(video => {
      const { id, segmentDurations } = video

      return segmentDurations.map((duration, index) => {
        const url = join('/', 'api', 'hls', id, `${id}${index}.ts`);
        return `#EXTINF:${duration},\n${url}\n`
      }).join('')
    }).join(m3u8Discontinuity)

    return `${m3u8Template}${tsSegments}`
    // return `${m3u8Template}${tsSegments}\n#EXT-X-ENDLIST`
  }
}
