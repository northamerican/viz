export const appPort = 1989;
export const appIp = "192.168.68.115"
export const appUrl = `http://${appIp}:${appPort}/`;

const projectRoot = new URL(import.meta.url + "/../..").pathname;
export const mp4Dir = `${projectRoot}public/mp4/`;
export const hlsDir = `${projectRoot}public/hls/`;
export const dbDir = `${projectRoot}src/db/`;
export const vizM3u8 = 'viz.m3u8'
export const redirectEndpoint = `/token`;
