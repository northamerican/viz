export const appUrl = "192.168.68.115";
export const appPort = 5173;

export const __dirname = new URL(import.meta.url + "/..").pathname;
export const mp4Dir = __dirname + "../public/mp4/";
export const hlsDir = __dirname + "../public/hls/";
export const dbDir = __dirname + "db/";
export const vizM3u8 = 'viz.m3u8'

export const maxVideoDuration = 12 * 60;

export const redirectEndpoint = `/token`;

export const playersApiKeys = {
  spotify: {
    clientId: "a3d79c3e9aca4b4b9bd332d0e1b1fe26",
    clientSecret: "2d9891e59a85492e90cde610fb29c135",
  },
};

export const settings = {
  aspectRatios: ["4:3"],
};
