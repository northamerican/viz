import { VideosDb } from "./VideosDb";
import { join } from "path";

const m3u8Template = () => `#EXTM3U
#EXT-X-VERSION:3
# setting it to 9 for less polling but it was working fine at 6
#EXT-X-TARGETDURATION:9
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-START:TIME-OFFSET=${(Date.now() - VideosDb.getStartTime()) / 1000}`

export const VizM3u8 = {
  getM3u8() {
    let totalDuration = 0
    // let mediaSequence = 0

    const tsSegments = VideosDb.getVideoSegmentInfo().map(({ videoId, duration, segmentIndex }) => {
      const timeOffset = VideosDb.getStartTime() + (1000 * totalDuration);
      const discontinuity = segmentIndex === 0 ? '#EXT-X-DISCONTINUITY' : ''
      const programDateTime = `#EXT-X-PROGRAM-DATE-TIME:${new Date(timeOffset).toISOString()}`;
      const infDuration = `#EXTINF:${duration.toFixed(6)}`;
      const url = join('/', 'api', 'hls', videoId, `${videoId}${segmentIndex}.ts`);

      totalDuration += duration
      return [discontinuity, programDateTime, infDuration, url].join('\n');
    }).join('')

    return [m3u8Template(), tsSegments].join('\n');
  }
}

// okay, so without new videos being added it doesn't get the next video
// either because it thinks that's all that's left or there's some kind of time window.
// might always need x amount of time ahead?
// anyway. keep the videos coming in and we're good.
// might be able to keep the whole list and just keep appending new .ts?
// or just do a proper rolling window.


// might be able to just remove PROGRAM-DATE-TIME from the m3u8
// or go harder by adding EXT-X-DATERANGE and other time related tags 

// so we got server start time and current time
// we want a rolling window that includes T- a few segments
// plus the next 10 or so segments? 
// so perform a filter on videos based on time difference
// and make #EXT-X-MEDIA-SEQUENCE be the number of videos not included from the start

// convert all segments to this format 
// (or make Segment type be in this format?)
// { }

// can probably revert a bunch of bullshit 
// also seemed to work without m3u8Discontinuity but i put it back