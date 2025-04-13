import cp from "child_process";
import { join } from "path";
import ffmpegPath from "ffmpeg-static";
import { VideosDb } from "../db/VideosDb.ts";
import { getSegmentDurations, durationTotal } from "../helpers.ts";
import { aspectRatioFull } from "../../consts.ts";
import {
  ffmpegLogLevel,
  ffmpegThreadQueueSize,
  hlsDir,
  sigtermCode,
} from "../consts.ts";
import { SettingsDb } from "../db/SettingsDb.ts";

type AnalysisProcessParams = {
  videoId: string;
  logToConsole: boolean;
};

type FilterProcessParams = AnalysisProcessParams & {
  cropWidth?: number;
  cropX?: number;
  measured_I: string;
  measured_TP: string;
  measured_LRA: string;
  measured_thresh: string;
  offset: string;
};

export async function analysisProcess({
  videoId,
  logToConsole,
}: AnalysisProcessParams): Promise<FilterProcessParams> {
  console.log(`Analyzing video ${videoId}...`);

  const hlsVideoDir = join(hlsDir, videoId);
  const videoFilePath = join(hlsVideoDir, `${videoId}.mp4`);
  const analysisProcess = cp.spawn(
    ffmpegPath,
    // prettier-ignore
    [
      "-i", videoFilePath,
      "-ss", "1", // Skip first second
      "-t", "60", // Limit 60 seconds
      "-vf", "cropdetect",
      "-af", "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json",
      "-f", "null",
      " -",
    ]
  );

  await VideosDb.editVideo(videoId, {
    pid: analysisProcess.pid,
  });

  const videoWidthRegex = /\s(\d+)x\d+[,\s]/;
  const cropdetectRegex = /w:(\d+).*x:(\d+)/;
  const cropdetectKey = "Parsed_cropdetect";
  const loudnormKey = "Parsed_loudnorm";
  const loudnormRegex = /{[\s\S]*}/;

  let videoInfoOutput: string;
  let cropdetectOutput: string;
  let loudnormOutput: string;

  analysisProcess.stderr.on("data", (data) => {
    const dataStr = data.toString();

    if (logToConsole) {
      console.debug(dataStr);
    }
    if (dataStr.includes(cropdetectKey) && cropdetectRegex.test(dataStr)) {
      cropdetectOutput = dataStr;
      return;
    }
    if (dataStr.includes(loudnormKey)) {
      loudnormOutput = dataStr.match(loudnormRegex);
      return;
    }
    if (videoWidthRegex.test(dataStr)) {
      videoInfoOutput = dataStr;
    }
  });

  return new Promise<FilterProcessParams>((resolve, reject) => {
    analysisProcess.on("close", async (code) => {
      if (code === sigtermCode) {
        return reject(sigtermCode);
      }

      const isWidescreen = videoInfoOutput.includes("DAR 16:9");

      let cropWidth,
        cropX,
        measured_I,
        measured_TP,
        measured_LRA,
        measured_thresh,
        offset;

      if (isWidescreen) {
        try {
          const [, width] = videoInfoOutput.match(videoWidthRegex).map(Number);

          const [, outputWidth, outputX] = cropdetectOutput
            .match(cropdetectRegex)
            .map(Number);

          // Account for pillarboxed 4:3 inside 16:9 videos with
          // artifacts making them appear a little narrower than they are.
          const maxAspectWidthThreshold = 0.05;
          const outputWidthRatio = width / outputWidth;
          const isPillarbox =
            Math.abs(outputWidthRatio - aspectRatioFull) <
            maxAspectWidthThreshold;

          if (isPillarbox) {
            [cropWidth, cropX] = [outputWidth, outputX];
          }
        } catch {
          //
        }
      }

      try {
        ({
          input_i: measured_I,
          input_tp: measured_TP,
          input_lra: measured_LRA,
          input_thresh: measured_thresh,
          target_offset: offset,
        } = JSON.parse(loudnormOutput));
      } catch {
        // TODO
      }

      return resolve({
        videoId,
        logToConsole,
        cropWidth,
        cropX,
        measured_I,
        measured_TP,
        measured_LRA,
        measured_thresh,
        offset,
      });
    });
  });
}

export async function filterProcess({
  videoId,
  logToConsole,
  cropWidth,
  cropX,
  measured_I,
  measured_TP,
  measured_LRA,
  measured_thresh,
  offset,
}: FilterProcessParams) {
  console.log(`Processing video ${videoId}...`);

  const hlsVideoDir = join(hlsDir, videoId);
  const videoFilePath = join(hlsVideoDir, `${videoId}.mp4`);
  const m3u8FilePath = join(hlsVideoDir, `${videoId}.m3u8`);
  const { aspectRatioCorrectionFactor } = SettingsDb;
  const shouldCrop = cropWidth && cropX;
  const shouldCorrectAspectRatio = aspectRatioCorrectionFactor !== 1;
  const videoFilters = [
    shouldCrop ? `crop=${cropWidth}:ih:${cropX}:0` : "",
    shouldCorrectAspectRatio
      ? `scale=2*round((iw*${aspectRatioCorrectionFactor})/2):ih`
      : "",
    "setsar=1",
  ]
    .filter(Boolean)
    .join(",");
  const shouldLoudnorm = measured_I;
  const audioFilters = shouldLoudnorm
    ? `loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${measured_I}:measured_TP=${measured_TP}:measured_LRA=${measured_LRA}:measured_thresh=${measured_thresh}:offset=${offset}:linear=true`
    : "";
  // TODO ^ test that blank audioFilters works
  const filterComplex = `[0:v]${videoFilters}[v];[0:a]${audioFilters}[a]`;

  const filterProcess = cp.spawn(
    ffmpegPath,
    // prettier-ignore
    [
      "-loglevel", ffmpegLogLevel,
      "-thread_queue_size", ffmpegThreadQueueSize,
      "-i", videoFilePath,
      "-filter_complex", filterComplex,
      "-map", `[v]`, "-map", `[a]`,
      "-start_number", "0",
      "-hls_time", "10",
      "-hls_list_size", "0",
      "-f", "hls",
      m3u8FilePath,
    ]
  );

  await VideosDb.editVideo(videoId, {
    pid: filterProcess.pid,
  });

  filterProcess.stderr.on("data", async (data) => {
    const dataStr = data.toString();

    if (logToConsole) {
      console.debug(dataStr);
    }

    // Check for writing to file output
    const wroteToFileMsg = [".ts", "for writing"].every((str) =>
      dataStr.includes(str)
    );
    if (!wroteToFileMsg) return;

    // Write segments to video db as they are processed
    const segmentDurations = getSegmentDurations(m3u8FilePath);
    VideosDb.editVideo(videoId, {
      segmentDurations: segmentDurations,
      duration: segmentDurations.reduce(durationTotal, 0),
    });
  });

  return new Promise<void>((resolve, reject) => {
    filterProcess.on("close", async (code) => {
      if (code === sigtermCode) {
        return reject(sigtermCode);
      }

      const segmentDurations = getSegmentDurations(m3u8FilePath);
      await VideosDb.editVideo(videoId, {
        segmentDurations: segmentDurations,
        duration: segmentDurations.reduce(durationTotal, 0),
        downloaded: true,
        downloading: false,
        pid: null,
      });

      resolve();
    });
  });
}
