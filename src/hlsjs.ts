import Hls from "hls.js";
import { vizM3u8 } from "./consts";

window.addEventListener("load", () => {
  if (!Hls.isSupported()) return;

  const hls = new Hls({
    debug: true,
  });

  // chrome?
  // const video = document.getElementById("video");
  // hls.attachMedia(video);

  hls.loadSource(`../hls/${vizM3u8}`);

  hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
    console.log(data);
  });
});
