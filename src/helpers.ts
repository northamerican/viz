import fs from "fs";

export function getSegmentDurations(filePath: fs.PathOrFileDescriptor) {
  return fs.readFileSync(filePath)
    .toString()
    .split('\n')
    .filter(line => line.startsWith('#EXTINF'))
    .map(extInfDuration => +extInfDuration.match(/\#EXTINF:([\d\.]+),/)[1]);
}
export function durationTotal(total: number, duration: number) {
  return total + duration;
}
