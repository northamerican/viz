import express from "express";
import compression from "compression";
import { appHost, port, projectRoot, appUrl, hlsDir } from "./consts";
import { m3u8Path } from "../consts";
import { VideosDb } from "./db/VideosDb";

// Init
// console.log("clear downloading");
// VideosDb.clearDownloading();

const app = express();

app.use(express.text());

app.all("/_telefunc", async (req, res) => {
  const { originalUrl: url, method, body } = req;
  const { telefunc } = await import("telefunc");
  const httpResponse = await telefunc({ url, method, body });
  res
    .status(httpResponse.statusCode)
    .type(httpResponse.contentType)
    .send(httpResponse.body);
});

app.get(m3u8Path, compression({ filter: () => true }), async (_, res) => {
  const { vizM3u8 } = await import("./vizM3u8");
  const m3u8 = await vizM3u8();

  return res.type("application/vnd.apple.mpegurl").send(m3u8);
});

app.use("/hls", express.static(hlsDir));

if (process.env.NODE_ENV === "production") {
  app.use(express.static(`${projectRoot}/dist/client`));
} else {
  const vite = await import("vite");
  const viteDevMiddleware = (
    await vite.createServer({
      server: { middlewareMode: true },
    })
  ).middlewares;
  app.use(viteDevMiddleware);
}

app.listen(port, appHost, () => console.log(`viz running at ${appUrl}`));
