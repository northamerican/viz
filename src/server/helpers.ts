import fs from "fs";
import os from "os";

export function getLocalIp() {
  return Object.values(os.networkInterfaces()).reduce(
    (r, list) =>
      r.concat(
        list.reduce(
          (rr, i) =>
            rr.concat((i.family === "IPv4" && !i.internal && i.address) || []),
          []
        )
      ),
    []
  )[0];
}

export function getSegmentDurations(filePath: fs.PathOrFileDescriptor) {
  return fs
    .readFileSync(filePath)
    .toString()
    .split("\n")
    .filter((line) => line.startsWith("#EXTINF"))
    .map((extInfDuration) => +extInfDuration.match(/#EXTINF:([\d.]+),/)[1]);
}
export function durationTotal(total: number, duration: number) {
  return total + duration;
}
