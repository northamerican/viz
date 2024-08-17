import fs from "fs";
import os from "os";

export function getLocalIp() {
  return Object.values(os.networkInterfaces())
    .flat()
    .find(({ family, internal }) => family === "IPv4" && !internal).address;
}

export function getSegmentDurations(filePath: fs.PathOrFileDescriptor) {
  return fs
    .readFileSync(filePath)
    .toString()
    .split("\n")
    .filter((line) => line.startsWith("#EXTINF"))
    .map((extInfDuration) => +extInfDuration.match(/#EXTINF:([\d.]+),/)[1]);
}

export function durationToSeconds(duration: string) {
  return duration.split(":").reduce((acc, time) => 60 * acc + +time, 0);
}

export function durationTotal(total: number, duration: number) {
  return total + duration;
}
