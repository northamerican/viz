export const m3u8Path = "/m3u8";
export const hlsPath = "/hls";
export const eventsPath = "/events";
export const tokenPath = (playerId = "") => `/token/${playerId}`;

export const serverEventNames = [
  "accounts:write",
  "queues:write",
  "store:write",
  "videos:write",
] as const;

export const maxVideoDuration = 12 * 60;
export const interstitalEveryTracksCount = 2;
export const dialogAlternateVideoCount = 6;
export const newTracksInterval = 15000;

export const maxQualityOptions = [
  { label: "720p", value: 720 },
  { label: "1080p", value: 1080 },
  { label: "1440p", value: 1440 },
  { label: "2160p", value: 2160 },
];

export const receiverAspectRatios = [
  {
    label: "16:9",
    value: 1.7777777777777777,
  },
];

export const displayAspectRatios = [
  {
    label: "16:9",
    value: 1.7777777777777777,
  },
  {
    label: "4:3",
    value: 1.3333333333333333,
  },
];
