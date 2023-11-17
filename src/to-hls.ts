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

export default async (videoId: string) => {
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
    // .on('error'...)
    .on('close', async () => {
      console.log(`Appending #EXTINF to ${vizM3u8}`)

      const tsDurations = getTsDurations(`${hlsVideoDir}${videoId}.m3u8`)

      // TODO use tsDurations or refine all this

      const out = tsDurations.map((duration, i) => {
        return `#EXTINF:${duration},\n${videoId}/${videoId}${i}.ts\n`
      }).join('')

      fs.appendFileSync(`${hlsDir}${vizM3u8}`, out)
      fs.appendFileSync(`${hlsDir}${vizM3u8}`, m3uDiscontinuity)

      console.log(tsDurations)
    });

  process.stdio[2].on('data', data => console.log(data.toString()))

  return process
};


