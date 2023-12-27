import Hls from "hls.js";
import { m3u8Path } from "./consts";


window.addEventListener("load", () => {
  if (!Hls.isSupported()) return;

  const hls = new Hls({
    debug: true,
  });

  const video = document.getElementById("video");
  //@ts-ignore
  hls.attachMedia(video);

  hls.loadSource(m3u8Path);

  hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
    console.log(data);
  });
});
