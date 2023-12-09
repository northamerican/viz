import { tsPath } from "../consts";
import { QueuesDb } from "./db/QueuesDb";

type M3u8Template = (args: { now: number; longestSegmentDuration: number, mediaSequence?: number; }) => string
const m3u8Template: M3u8Template = ({ now, longestSegmentDuration, mediaSequence = 0 }) => `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:${longestSegmentDuration}
#EXT-X-MEDIA-SEQUENCE:${mediaSequence}
#EXT-X-START:TIME-OFFSET=${(now - QueuesDb.startTime) / 1000}`

// way with more flexibility (as is) which is simpler and may allow seeking to any point:
// setting time offset and not having earliestSegmentTime
// so all segments just accumulate in the m3u8 and never clear.
// TODO check performance of this fn and see if caching is needed when there's lots of clips

// previous way that works but would complicate seeking:
// set #EXT-X-START:TIME-OFFSET=0 and 

const streamWindowTimeBefore = 0
const streamWindowTimeAfter = 45000

export const vizM3u8 = () => {
  let totalDuration = 0
  let mediaSequence = Infinity

  const now = Date.now()
  const { currentQueueSegmentInfo } = QueuesDb
  const longestSegmentDuration = Math.ceil(Math.max(...currentQueueSegmentInfo.map(({ duration }) => duration)))
  const tsSegments = currentQueueSegmentInfo.map(({
    videoId,
    duration,
    segmentIndex
  }, playlistSegmentIndex) => {
    const timeOffset = QueuesDb.state.startTime + (1000 * totalDuration);
    totalDuration += duration

    const earliestSegmentTime = now - streamWindowTimeBefore
    const latestSegmentTime = now + streamWindowTimeAfter
    const excludeSegment = latestSegmentTime < timeOffset
    // const excludeSegment = earliestSegmentTime > timeOffset || latestSegmentTime < timeOffset

    if (excludeSegment) return ''

    // Lowest segment index indicates the first sequence
    mediaSequence = Math.min(mediaSequence, playlistSegmentIndex)

    const discontinuity = segmentIndex === 0 ? '\n#EXT-X-DISCONTINUITY' : ''
    // const programDateTime = `#EXT-X-PROGRAM-DATE-TIME:${new Date(timeOffset).toISOString()}`;
    const infDuration = `#EXTINF:${duration.toFixed(6)}`;
    const tsUrl = tsPath(videoId, segmentIndex);

    // return [discontinuity, programDateTime, infDuration, url].join('\n');
    return [discontinuity, infDuration, tsUrl].join('\n');
  }).join('')

  // TODO append endless stream of Viz logo at the end until something new is queued

  return [m3u8Template({ now, longestSegmentDuration, mediaSequence }), tsSegments].join('\n');
}
