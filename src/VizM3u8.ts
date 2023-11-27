import { VideosDb } from "./VideosDb";
import { join } from "path";

const m3u8Template = ({ mediaSequence = 0 }) => `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:${mediaSequence}
#EXT-X-START:TIME-OFFSET=0`
// #EXT-X-START:TIME-OFFSET=${(now - VideosDb.getStartTime()) / 1000}`

const streamWindowTimeBefore = 0
const streamWindowTimeAfter = 45000

export const VizM3u8 = () => {
  let totalDuration = 0
  let mediaSequence = Infinity

  const now = Date.now()
  const tsSegments = VideosDb.getVideoSegmentInfo().map(({
    videoId,
    duration,
    segmentIndex
  }, playlistSegmentIndex) => {
    const timeOffset = VideosDb.getStartTime() + (1000 * totalDuration);
    totalDuration += duration

    const earliestSegmentTime = now - streamWindowTimeBefore
    const latestSegmentTime = now + streamWindowTimeAfter
    const excludeSegment = earliestSegmentTime > timeOffset || latestSegmentTime < timeOffset

    if (excludeSegment) return ''

    // Lowest segment index indicates the first sequence
    mediaSequence = Math.min(mediaSequence, playlistSegmentIndex)

    const discontinuity = segmentIndex === 0 ? '\n#EXT-X-DISCONTINUITY' : ''
    // const programDateTime = `#EXT-X-PROGRAM-DATE-TIME:${new Date(timeOffset).toISOString()}`;
    const infDuration = `#EXTINF:${duration.toFixed(6)}`;
    const url = join('/api', 'hls', videoId, `${videoId}${segmentIndex}.ts`);

    // return [discontinuity, programDateTime, infDuration, url].join('\n');
    return [discontinuity, infDuration, url].join('\n');
  }).join('')

  // TODO append endless stream of Viz logo at the end until something new is queued

  return [m3u8Template({ mediaSequence }), tsSegments].join('\n');
}
