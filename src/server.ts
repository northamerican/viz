import express from "express";
import compression from "compression";
import { promises as fs, createReadStream } from "fs";
import querystring from "node:querystring";
import ViteExpress from "vite-express";

import sources from "./sources";
import players from "./players";
import {
  __dirname,
  playersApiKeys,
  redirectEndpoint,
  hlsDir,
  appUrl,
  appPort,
  vizM3u8,
} from "./consts.ts";
import { isAxiosError } from "axios";
import { TrackList, VizPrefs } from "./types/viz";
import toHls from "./to-hls.ts";

const app = express();
app.use(compression());
app.use(express.json());

// todo move
const prefs: VizPrefs = {
  player: "spotify",
  source: "youtube",
};

// move to /players?
app.get("/authorize", (req, res) => {
  const { clientId } = playersApiKeys.spotify;
  const scope =
    "user-read-private user-read-email user-read-currently-playing user-read-playback-state";

  res.redirect(
    "https://accounts.spotify.com/authorize?" +
    querystring.stringify({
      response_type: "code",
      client_id: clientId,
      scope: scope,
      redirect_uri: `http://${appUrl}:${appPort}${redirectEndpoint}`,
    })
  );
});

app.get(redirectEndpoint, async (req, res) => {
  const { player } = prefs;

  try {
    const data = await players[player].getToken(req);
    res.cookie("token", data.access_token);
    res.cookie("refreshToken", data.refresh_token);
    res.redirect(`http://${appUrl}:${appPort}/`);
  } catch (e) {
    console.log(e);
  }
});

app.get("/queue", async (req, res) => {
  const { player } = prefs;

  try {
    const queue = await players[player].getQueue(req);

    res.json(queue);
  } catch (error) {
    if (isAxiosError<TrackList>(error)) {
      // if 401 handleRefreshToken();
      res.status(error.response.status).send();
    }
  }
});

app.get("/current", async (req, res) => {
  const { player } = prefs;

  try {
    const current = await players[player].getCurrentlyPlaying(req);

    res.json(current);
  } catch (error) {
    if (isAxiosError<TrackList>(error)) {
      // if 401 handleRefreshToken();
      res.status(error.response.status).send();
    }
  }
});

app.get("/video", (req, res) => {
  //
});

app.post("/video", async (req, res) => {
  const { artist, title } = req.body;
  const { source } = prefs;

  console.log(`Getting video for ${title} - ${artist}`)
  const searchQuery = sources[source].createSearchQuery({ artist, title });
  const { video, videoId } = await sources[source].getVideo(searchQuery);
  const videoStream = sources[source].writeVideoStream(video, videoId);

  videoStream.on("finish", () => {
    console.log(`Got video ${videoId} for ${title} - ${artist}`)
    res.status(201).json({ videoId });
    toHls(videoId)
  });
});

app.get(`/hls/${vizM3u8}`, async (_, res) => {
  // TODO serve this generated on-demand from a db
  // TODO confirm sending as gzip ?
  try {
    const contents = await fs.readFile(`${hlsDir}${vizM3u8}`);
    if (!contents) return res.sendStatus(500);

    res.type("application/vnd.apple.mpegurl");
    return res.status(200).send(contents);
  } catch (error) {
    return res.sendStatus(500);
  }
});

app.get("/hls/:filename.ts", async (req, res) => {
  const { filename } = req.params;
  try {
    const stream = createReadStream(`${hlsDir}/${filename}.ts`, {
      highWaterMark: 64 * 1024, // TODO adjust?
    });
    res.type("video/MP2T");
    return stream.pipe(res);
  } catch (error) {
    return res.sendStatus(500);
  }
});

const server = app.listen(appPort, appUrl, () =>
  console.log(`viz running at http://${appUrl}:${appPort}`)
);

ViteExpress.bind(app, server);
