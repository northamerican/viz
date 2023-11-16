// Adapted from
// https://github.com/fent/node-ytdl-core/blob/master/example/ffmpeg.js
import ytdl from "@distube/ytdl-core";
import ffmpegPath from "ffmpeg-static";
import cp from "child_process";
import stream from "stream";

export default (link, options = {}) => {
  const result = new stream.PassThrough({
    highWaterMark: options.highWaterMark || 1024 * 512,
  });

  ytdl
    .getInfo(link, options)
    .then((info) => {
      const audioStream = ytdl.downloadFromInfo(info, {
        ...options,
        quality: "highestaudio",
      });
      const videoStream = ytdl.downloadFromInfo(info, {
        ...options,
        quality: "highestvideo",
      });
      const ffmpegProcess = cp.spawn(
        ffmpegPath,
        [
          // supress non-crucial messages
          "-loglevel",
          "8",
          "-hide_banner",
          // input audio and video by pipe
          "-i",
          "pipe:3",
          "-i",
          "pipe:4",
          // map audio and video correspondingly
          "-map",
          "0:a",
          "-map",
          "1:v",
          //
          "-c:v",
          "libx265",
          //
          "-crf",
          "18",
          // no need to change the codec
          "-c",
          "copy",
          //
          "-movflags",
          "frag_keyframe+empty_moov",
          // output mp4 and pipe
          "-f",
          "mp4",
          "pipe:5",
        ],
        {
          stdio: [
            // silence stdin/out, forward stderr,
            "inherit",
            "inherit",
            "inherit",
            // and pipe audio, video, output
            "pipe",
            "pipe",
            "pipe",
          ],
        }
      );
      audioStream.pipe(ffmpegProcess.stdio[3]);
      videoStream.pipe(ffmpegProcess.stdio[4]);
      ffmpegProcess.stdio[5].pipe(result);
    })
    .catch((err) => result.emit("error", err));

  return result;
};
