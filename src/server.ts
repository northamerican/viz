import express from "express";
import compression from "compression";
import { createReadStream } from "fs";
import ViteExpress from "vite-express";
import { join } from "path"

import sources from "./sources";
import players from "./players";
import {
  redirectEndpoint,
  hlsDir,
  appUrl,
  appPort,
  vizM3u8,
  dbDir,
  appIp,
} from "./consts.ts";
import { isAxiosError } from "axios";
import { JSONPreset } from 'lowdb/node'
import { VizM3u8 } from "./VizM3u8.ts";
import type { TrackList, VizPrefs } from "Viz";

// move to a PrefsDb
const prefs = await JSONPreset<VizPrefs>(join(dbDir, 'prefs.json'), {
  "player": "spotify",
  "source": "youtube",
})

const app = express();
app.use(compression());
app.use(express.json());

app.get("/authorize", (_, res) => {
  const { player } = prefs.data;
  try {
    const redirectUrl = players[player].authorize();

    res.redirect(redirectUrl);
  } catch (e) {
    console.log(e)
  }
});

app.get(redirectEndpoint, async (req, res) => {
  const { player } = prefs.data;

  try {
    await players[player].getToken(req);

    res.cookie("isLoggedIn", true);
    res.redirect(appUrl);
  } catch (e) {
    console.log(`${redirectEndpoint} failed.`)
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

// TODO rename join('api', 'stream')
app.get(`/api/hls/${vizM3u8}`, async (_, res) => {
  // TODO confirm sending as gzip ?
  try {
    const m3u8 = VizM3u8.buildM3u8()

    return res
      .setHeader('Content-Type', "application/vnd.apple.mpegurl")
      .send(m3u8);
  } catch (error) {
    return res.sendStatus(500);
  }
});

// TODO rename join('api', 'ts', ':filename')
app.get("/api/hls/:dir/:filename.ts", async (req, res) => {
  const { dir, filename } = req.params;
  try {
    const stream = createReadStream(join(hlsDir, dir, `${filename}.ts`), {
      highWaterMark: 64 * 1024, // TODO adjust?
    });
    res.setHeader('Content-Type', 'video/mp2t');
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

const server = app.listen(appPort, appIp, () =>
  console.log(`viz running at ${appUrl}`)
);

ViteExpress.bind(app, server);
