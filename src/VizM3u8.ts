import { VideosDb } from "./VideosDb";
import { join } from "path";

const m3u8Template = `#EXTM3U
#EXT-X-VERSION:12
# low values, even 60 eventually kill the video for some reason.
# a high value works realiably but doesn't fetch the m3u8 continuously 
#EXT-X-TARGETDURATION:40
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-START:TIME-OFFSET=0\n`
// #EXT-X-PROGRAM-DATE-TIME:${(new Date).toISOString()}\n`

//   `#EXTM3U
// #EXT-X-VERSION:3
// #EXT-X-TARGETDURATION:10
// #EXT-X-MEDIA-SEQUENCE:0`

// #EXT-X-INDEPENDENT-SEGMENTS

// `${(new Date).toISOString()}`

const m3u8Discontinuity = '#EXT-X-DISCONTINUITY\n'

export const VizM3u8 = {
  buildM3u8() {
    const videos = VideosDb.getVideos()
    const tsSegments = videos.map(video => {
      const { id, segmentDurations } = video

      return segmentDurations.map((duration, index) => {
        const url = join('/', 'api', 'hls', id, `${id}${index}.ts`);
        return `#EXTINF:${duration},\n${url}\n`
      }).join('')
    }).join(m3u8Discontinuity)

    return `${m3u8Template}${tsSegments}`
  }
}
