import express from "express";
import compression from "compression";
import { createReadStream } from "fs";
import querystring from "node:querystring";
import ViteExpress from "vite-express";
import { join } from "path"

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
  dbDir,
} from "./consts.ts";
import { isAxiosError } from "axios";
import { TrackList, VizPrefs } from "./types/viz";
import { JSONPreset } from 'lowdb/node'
import { VizM3u8 } from "./VizM3u8.ts";

const prefs = await JSONPreset<VizPrefs>(`${dbDir}prefs.json`, {
  "player": "spotify",
  "source": "youtube",
})

const app = express();
app.use(compression());
app.use(express.json());

// move to /players?
app.get("/authorize", (_, res) => {
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
  const { player } = prefs.data;

  try {
    await players[player].getToken(req);

    res.cookie("isLoggedIn", true);
    res.redirect(`http://${appUrl}:${appPort}/`);
  } catch (e) {
    console.log(e);
  }
});

app.get("/logout", async (_, res) => {
  const { player } = prefs.data;

  try {
    await players[player].logout();

    res.status(204).send()
  } catch (error) {
    if (isAxiosError<TrackList>(error)) {
      res.status(error.response.status).send();
    }
  }
});

app.get("/queue", async (_, res) => {
  const { player } = prefs.data;

  try {
    const queue = await players[player].getQueue();

    res.json(queue);
  } catch (error) {
    if (isAxiosError<TrackList>(error)) {
      res.status(error.response.status).send();
    }
  }
});

app.get("/current", async (_, res) => {
  const { player } = prefs.data;

  try {
    const current = await players[player].getCurrentlyPlaying();

    res.json(current);
  } catch (error) {
    if (isAxiosError<TrackList>(error)) {
      res.status(error.response.status).send();
    }
  }
});

// app.get("/video", (req, res) => {
// 
// });

app.post("/video", async (req, res) => {
  const { artist, title } = req.body;
  const { source } = prefs.data;

  console.log(`Getting video for ${title} - ${artist}`)
  const searchQuery = sources[source].createSearchQuery({ artist, title });
  const { video, videoId } = await sources[source].getVideo(searchQuery);

  await sources[source].writeVideoStream(video, videoId);

  res.status(201).send();
});

app.get(`/hls/${vizM3u8}`, async (_, res) => {
  // TODO confirm sending as gzip ?
  try {
    const m3u8 = VizM3u8.buildM3u8()
    return res.type("application/vnd.apple.mpegurl")
      .status(200)
      .send(m3u8);
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

app.get("/db/videos.json", async (_, res) => {
  try {
    const stream = createReadStream(join(dbDir, 'videos.json'));
    res.type('json')
    return stream.pipe(res);
  } catch (error) {
    return res.sendStatus(500);
  }
});

const server = app.listen(appPort, appUrl, () =>
  console.log(`viz running at http://${appUrl}:${appPort}`)
);

ViteExpress.bind(app, server);
