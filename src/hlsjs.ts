import Hls from "hls.js";
import { url } from "./consts";

window.addEventListener("load", () => {
  if (!Hls.isSupported()) return;

  const hls = new Hls({
    debug: true,
  });

  const video = document.getElementById("video");
  //@ts-ignore
  hls.attachMedia(video);

  hls.loadSource(url.api.m3u);

  hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
    console.log(data);
  });
});
