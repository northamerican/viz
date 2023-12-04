import cp from "child_process";
import stream from "stream";
import fs from "fs";
import { join } from "path";
import ytdl from "@distube/ytdl-core";
import ffmpegPath from "ffmpeg-static";
import { hlsDir } from "./consts";
import { VideosDb } from "./db/VideosDb";
import { getSegmentDurations, durationTotal } from "./helpers";

// TODO move to players/youtube
export default function youtubeToHls({ videoId, url, options }: {
  videoId: string,
  url: string,
  options?: ytdl.getInfoOptions
}) {
  const hlsVideoDir = join(hlsDir, videoId)
  const videoFilePath = join(hlsVideoDir, `${videoId}.m3u8`);

  if (!fs.existsSync(hlsVideoDir)) {
    fs.mkdirSync(hlsVideoDir);
  }

  const result = new stream.PassThrough({
    highWaterMark: 1024 * 512
  });

  console.log(`Generating HLS files for video ${videoId}`)
  const wroteToDbMsg = `Wrote ${videoId} segments to videos db in`
  console.time(wroteToDbMsg)

  ytdl
    .getInfo(url, options)
    .then((info) => {
      const audioStream = ytdl.downloadFromInfo(info, {
        ...options,
        quality: "highestaudio",
        filter: format => format.container === 'mp4'
      });
      const videoStream = ytdl.downloadFromInfo(info, {
        ...options,
        quality: "highestvideo",
        filter: format => format.codecs.startsWith('avc1')
      });
      const process = cp.spawn(
        ffmpegPath,
        [
          "-loglevel", "32",
          //
          "-i", "pipe:3",
          //
          "-i", "pipe:4",
          // Map audio and video
          "-map", "0:a",
          "-map", "1:v",
          //
          "-c", "copy",
          // is this needed? 
          "-movflags", "frag_keyframe+empty_moov",
          //
          "-start_number", "0",
          //
          "-hls_time", "10",
          //
          "-hls_list_size", "0 ",
          //
          "-f", "hls",
          videoFilePath,
        ],
        {
          stdio: [
            // silence stdin/out, forward stderr,
            "inherit", "inherit", "pipe",
            // and pipe audio, video
            "pipe", "pipe",
          ],
        }
      );
      // @ts-ignore
      audioStream.pipe(process.stdio[3]);
      // @ts-ignore
      videoStream.pipe(process.stdio[4]);

      process.stdio[2].on('data', (data: any) => {
        // TODO could maybe just do this on 'close', ie the end of the video loaded ?
        // For debugging
        // console.log(data.toString())

        // TODO remove this hack
        // Data can be received before the creation of the m3u file
        if (!fs.existsSync(videoFilePath)) return

        VideosDb.editVideo(videoId, {
          segmentDurations: getSegmentDurations(videoFilePath)
        })
      })

      process
        .on('close', async () => {
          VideosDb.editVideo(videoId, {
            duration: getSegmentDurations(videoFilePath).reduce(durationTotal, 0),
            downloaded: true,
            downloading: false,
          })

          console.timeEnd(wroteToDbMsg)
        });
    })
    .catch((err) => {
      console.log({ err })
      return result.emit("error", err);
    });

  return result;
}
