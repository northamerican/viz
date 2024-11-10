export const m3u8Path = "/m3u8";
export const hlsPath = "/hls";
export const eventsPath = "/events";
export const tokenPath = (playerId = "") => `/token/${playerId}`;

export const serverEventNames = [
  "accounts:write",
  "queues:write",
  "settings:write",
  "videos:write",
] as const;

export const interstitalEveryTracksCount = 2;
export const dialogAlternateVideoCount = 6;
export const newTracksInterval = 15000;

export const maxQualityOptions = [
  { label: "2160p", value: 2160 },
  { label: "1440p", value: 1440 },
  { label: "1080p", value: 1080 },
  { label: "720p", value: 720 },
];

export const aspectRatioWide = 1.7777777777777777;
export const aspectRatioFull = 1.3333333333333333;

export const receiverAspectRatios = [
  {
    label: "16:9",
    value: aspectRatioWide,
  },
];

export const displayAspectRatios = [
  {
    label: "16:9",
    value: aspectRatioWide,
  },
  {
    label: "4:3",
    value: aspectRatioFull,
  },
];
