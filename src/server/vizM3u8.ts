import { hlsSegmentPath } from "./consts";
import { QueuesDb } from "./db/QueuesDb";
import { VideosDb } from "./db/VideosDb";

// TODO append onto cached string if needed due to performance

// Include segments within this many ms ahead of the current stream play position
const streamBufferTime = 45000;

export async function vizM3u8() {
  await Promise.all([QueuesDb.read(), VideosDb.read()]);

  let totalDuration = 0;
  let tsSegments = "";

  const { activeQueueSegmentInfo, activeQueue } = QueuesDb;
  const { startTime } = activeQueue;
  const now = Date.now();
  const startTimeOffset = (now - startTime) / 1000;
  // TODO probably not needed if ffmpeg is capping segments to x seconds
  const longestSegmentDuration = Math.ceil(
    Math.max(...activeQueueSegmentInfo.map(({ duration }) => duration))
  );

  const m3uHeaders = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:${longestSegmentDuration}
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-START:TIME-OFFSET=${startTimeOffset}`;

  for (const { videoId, duration, segmentIndex } of activeQueueSegmentInfo) {
    const timeOffset = startTime + 1000 * totalDuration;
    totalDuration += duration;

    const latestSegmentTime = now + streamBufferTime;
    const excludeSegment = latestSegmentTime < timeOffset;
    if (excludeSegment) break;

    const discontinuity = segmentIndex === 0 ? "\n#EXT-X-DISCONTINUITY" : "";
    const infDuration = `#EXTINF:${duration.toFixed(6)}`;
    const tsUrl = hlsSegmentPath(videoId, segmentIndex);

    tsSegments += [discontinuity, infDuration, tsUrl].join("\n");
  }

  // TODO append endless stream of Viz logo at the end until something new is queued

  return [m3uHeaders, tsSegments].join("\n");
}
