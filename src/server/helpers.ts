import fs from "fs";
import os from "os";

export function getLocalIp() {
  return Object.values(os.networkInterfaces())
    .flat()
    .find(({ family, internal }) => family === "IPv4" && !internal).address;
}

export function getSegmentDurations(filePath: fs.PathOrFileDescriptor) {
  try {
    return fs
      .readFileSync(filePath)
      .toString()
      .split("\n")
      .filter((line) => line.startsWith("#EXTINF"))
      .map((extInfDuration) => +extInfDuration.match(/#EXTINF:([\d.]+),/)[1]);
  } catch (error) {
    // console.error(error);
    return [];
  }
}

export function durationTotal(total: number, duration: number) {
  return total + duration;
}
