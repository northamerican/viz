import { tsPath } from "./consts";
import { QueuesDb } from "./db/QueuesDb";
import { VideosDb } from "./db/VideosDb";

type M3u8Template = (args: {
  startTime: number;
  now: number;
  longestSegmentDuration: number;
  mediaSequence?: number;
}) => string;
const m3u8Template: M3u8Template = ({
  startTime,
  now,
  longestSegmentDuration,
  mediaSequence = 0,
}) => `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:${longestSegmentDuration}
#EXT-X-MEDIA-SEQUENCE:${mediaSequence}
#EXT-X-START:TIME-OFFSET=${(now - startTime) / 1000}`;

// TODO check performance of this fn and see if caching is needed when there's lots of clips

const streamWindowTimeAfter = 45000;

export async function vizM3u8() {
  await Promise.all([QueuesDb.read(), VideosDb.read()]);

  let totalDuration = 0;
  let mediaSequence = Infinity;

  const now = Date.now();
  const { currentQueueSegmentInfo } = QueuesDb;
  const longestSegmentDuration = Math.ceil(
    Math.max(...currentQueueSegmentInfo.map(({ duration }) => duration)),
  );
  const tsSegments = currentQueueSegmentInfo
    .map(({ videoId, duration, segmentIndex }, playlistSegmentIndex) => {
      const timeOffset = QueuesDb.startTime + 1000 * totalDuration;
      totalDuration += duration;

      const latestSegmentTime = now + streamWindowTimeAfter;
      const excludeSegment = latestSegmentTime < timeOffset;

      if (excludeSegment) return "";

      // Lowest segment index indicates the first sequence
      mediaSequence = Math.min(mediaSequence, playlistSegmentIndex);

      const discontinuity = segmentIndex === 0 ? "\n#EXT-X-DISCONTINUITY" : "";
      const infDuration = `#EXTINF:${duration.toFixed(6)}`;
      const tsUrl = tsPath(videoId, segmentIndex);

      return [discontinuity, infDuration, tsUrl].join("\n");
    })
    .join("");

  // TODO append endless stream of Viz logo at the end until something new is queued

  return [
    m3u8Template({
      startTime: QueuesDb.startTime,
      now,
      longestSegmentDuration,
      mediaSequence,
    }),
    tsSegments,
  ].join("\n");
}
