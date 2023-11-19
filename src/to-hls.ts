import cp from "child_process";
import fs from "fs";
import ffmpegPath from "ffmpeg-static";
import { hlsDir, mp4Dir } from "./consts";
import { VideosDb } from "./VideosDb";

function getSegmentDurations(filePath: fs.PathOrFileDescriptor) {
  return fs.readFileSync(filePath)
    .toString()
    .split('\n')
    .filter(line => line.startsWith('#EXTINF'))
    .map(extInfDuration => +extInfDuration.match(/\#EXTINF:([\d\.]+),/)[1])
}

async function toHls(videoId: string) {
  const hlsVideoDir = `${hlsDir}${videoId}/`;
  const m3u8FilePath = `${hlsVideoDir}${videoId}.m3u8`;
  const mp4FilePath = `${mp4Dir}${videoId}.mp4`;

  if (!fs.existsSync(hlsVideoDir)) {
    fs.mkdirSync(hlsVideoDir);
  }

  console.log(`Generating HLS files for video ${videoId}`)
  console.time('in')

  const process = cp.spawn(ffmpegPath, [
    "-i",
    mp4FilePath,
    //
    "-profile:v",
    "baseline",
    //
    "-level",
    "3.0",
    //
    "-start_number",
    "0",
    //
    "-hls_time",
    "6",
    //
    "-hls_list_size",
    "0 ",
    //
    "-f",
    "hls",
    m3u8FilePath,
  ], { stdio: ['ignore', 'ignore', 'pipe'] });

  // This needs to be here or the ffmpeg process seems to die?
  process.stdio[2].on('data', data => {
    // Does this have to be here?
    // if (data.includes(hlsDir)) console.log(data.toString())

    if (!fs.existsSync(m3u8FilePath)) return

    VideosDb.editVideo(videoId, {
      segmentDurations: getSegmentDurations(m3u8FilePath)
    })
  })

  process
    .on('close', async () => {
      VideosDb.editVideo(videoId, {
        duration: getSegmentDurations(m3u8FilePath).reduce((total, dur) => total + dur, 0),
      })

      console.log(`Wrote ${videoId} segments to videos db`)
      console.timeEnd('in')
    });

  return process
};

export default toHls

// Run from node script
const [, path, videoId] = process.argv
if (!path.includes('server.ts') && videoId) {
  toHls(videoId)
}