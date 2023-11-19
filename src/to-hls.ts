import cp from "child_process";
import fs from "fs";
import ffmpegPath from "ffmpeg-static";
import { hlsDir, mp4Dir, vizM3u8 } from "./consts";

const m3uDiscontinuity = '#EXT-X-DISCONTINUITY\n\n'

function getTsDurations(filePath: fs.PathOrFileDescriptor) {
  return fs.readFileSync(filePath)
    .toString()
    .split('\n')
    .filter(line => line.startsWith('#EXTINF'))
    .map(extInfDuration => +extInfDuration.match(/\#EXTINF:([\d\.]+),/)[1])
}

async function toHls(videoId: string) {
  const hlsVideoDir = `${hlsDir}${videoId}/`;

  if (!fs.existsSync(hlsVideoDir)) {
    fs.mkdirSync(hlsVideoDir);
  }

  console.log(`Generating HLS files for video ${videoId}`)

  const process = cp.spawn(ffmpegPath, [
    "-i",
    `${mp4Dir}${videoId}.mp4`,
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
    `${hlsVideoDir}${videoId}.m3u8`,
  ], { stdio: ['ignore', 'ignore', 'pipe'] });

  process
    .on('close', async () => {
      const tsDurations = getTsDurations(`${hlsVideoDir}${videoId}.m3u8`)
      const out = tsDurations.map((duration, i) => {
        return `#EXTINF:${duration},\n${videoId}/${videoId}${i}.ts\n`
      }).join('')

      fs.appendFileSync(`${hlsDir}${vizM3u8}`, `${out}${m3uDiscontinuity}`)
      console.log(`Video ${videoId} appended to ${vizM3u8}.`)
    });

  process.stdio[2].on('data', data => console.log(data.toString()))

  return process
};

export default toHls

// Run from node script
const [, path, videoId] = process.argv
if (!path.includes('server.ts') && videoId) {
  toHls(videoId)
}