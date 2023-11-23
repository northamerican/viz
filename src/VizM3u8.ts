import { VideosDb } from "./VideosDb";
import { join } from "path";

const m3u8Template = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:9
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-START:TIME-OFFSET=0\n`

const m3u8Discontinuity = '#EXT-X-DISCONTINUITY\n'

export const VizM3u8 = {
  buildM3u8() {
    let totalDuration = 0
    const videos = VideosDb.getVideos()
    const tsSegments = videos.map(video => {
      const { id, segmentDurations } = video
      return segmentDurations.map((duration, index) => {
        const timeOffset = VideosDb.getStartTime() + (1000 * totalDuration);
        const programDateTime = `#EXT-X-PROGRAM-DATE-TIME:${new Date(timeOffset).toISOString()}`;
        const infDuration = `#EXTINF:${duration},live`;
        const url = join('/', 'api', 'hls', id, `${id}${index}.ts`);

        totalDuration += +duration
        return `${programDateTime}\n${infDuration}\n${url}\n`
      }).join('')
    }).join(m3u8Discontinuity)

    return `${m3u8Template}${tsSegments}`
  }
}


