import express from "express";
import compression from "compression";
import { createReadStream, readdirSync, rmSync } from "fs";
import ViteExpress from "vite-express";
import {
  url,
  appUrl,
  appPort,
  appIp,
  tsPath,
  hlsDir,
  mp4Dir,
} from "./consts.ts";
import { isAxiosError } from "axios";
import { VizM3u8 } from "./VizM3u8.ts";
import { QueuesDb, queuesDbEvents } from "./db/QueuesDb.ts";
import { VideosDb } from "./db/VideosDb.ts";
import { PrefsDb } from "./db/PrefsDb.ts";

const app = express();
app.use(express.json());
app.use(compression());

// Player

app.get(url.authorize, (_, res) => {
  try {
    const redirectUrl = PrefsDb.player.authorize();

    res.redirect(redirectUrl);
  } catch (e) {
    console.log(e)
  }
});

app.get(url.token, async (req, res) => {
  try {
    await PrefsDb.player.getToken(req);

    res.cookie("isLoggedIn", true);
    res.redirect(appUrl);
  } catch (e) {
    console.log(`${url.token} failed.`)
  }
});

app.get(url.api.logout, async (_, res) => {
  try {
    await PrefsDb.player.logout();

    res.sendStatus(204)
  } catch (error) {
    if (isAxiosError(error)) {
      res.sendStatus(error.response.status);
    }
  }
});

app.get(url.api.playlists, async (_, res) => {
  try {
    const playlists = await PrefsDb.player.getPlaylists();

    res.json(playlists);
  } catch (error) {
    if (isAxiosError(error)) {
      res.sendStatus(error.response.status);
    }
  }
});

app.get(url.api.playlist(':playlistId'), async (req, res) => {
  const { playlistId } = req.params;
  const { total } = req.query;

  try {
    const playlist = await PrefsDb.player.getPlaylist(playlistId, Number(total));

    res.json(playlist);
  } catch (error) {
    if (isAxiosError(error)) {
      res.sendStatus(error.response.status);
    }
  }
});

// Video streaming

app.delete(url.api.videos, async (_, res) => {
  try {
    VideosDb.delete()
    readdirSync(hlsDir).forEach(f => rmSync(`${hlsDir}/${f}`, { recursive: true }));
    readdirSync(mp4Dir).forEach(f => rmSync(`${mp4Dir}/${f}`));

    return res.sendStatus(200);
  } catch (error) {
    return res.sendStatus(500);
  }
});

app.post(url.api.video, async (req, res) => {
  const { artist, title, queueId, queueItemId } = req.body;

  console.log(`Getting video for ${title} - ${artist}`)
  const searchQuery = PrefsDb.source.createSearchQuery({ artist, title });
  const { video, videoId } = await PrefsDb.source.getVideo(searchQuery);

  // TODO Probably move this?
  QueuesDb.editItem(queueId, queueItemId, { videoId })

  await PrefsDb.source.writeVideoStream(video, videoId);

  res.status(201).json({ videoId });
});

app.get(url.api.m3u, async (_, res) => {
  // TODO confirm sending as gzip ?
  try {
    const m3u8 = VizM3u8()

    return res
      .type("application/vnd.apple.mpegurl")
      .send(m3u8);
  } catch (error) {
    return res.sendStatus(500);
  }
});

app.get(url.api.ts(':videoId', ':segmentIndex'), async (req, res) => {
  const { videoId, segmentIndex } = req.params;
  try {
    const stream = createReadStream(tsPath(videoId, segmentIndex), {
      highWaterMark: 64 * 1024, // TODO adjust?
    });
    res.setHeader('Content-Type', 'video/mp2t');
    return stream.pipe(res);
  } catch (error) {
    return res.sendStatus(500);
  }
});

// Queue

app.post(url.api.play, async (_, res) => {
  try {
    QueuesDb.startTime = Date.now()
    res.sendStatus(200)
  } catch (error) {
  }
});

// app.get(url.api.update, async (req, res) => {

// });

app.get(url.api.current, async (req, res) => {
  const sendCurrentQueueWithVideos = () => {
    res.write('event: update\n');
    res.write(`data: ${JSON.stringify(QueuesDb.currentQueueWithVideos)}\n`);
    res.write(`id: ${Date.now()}\n\n`);
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Content-Encoding': 'none',
    'Connection': 'keep-alive'
  });

  sendCurrentQueueWithVideos()
  queuesDbEvents.on('update', sendCurrentQueueWithVideos);

  req.on('close', () => res.end('OK'))
});

app.delete(url.api.queues, async (_, res) => {
  try {
    QueuesDb.delete()

    return res.sendStatus(200);
  } catch (error) {
    return res.sendStatus(500);
  }
});

app.post(url.api.queue, async (req, res) => {
  try {
    const { items } = req.body
    QueuesDb.addItems(items)

    return res.sendStatus(200);
  } catch (error) {
    return res.sendStatus(500);
  }
});

const server = app.listen(appPort, appIp, () =>
  console.log(`viz running at ${appUrl}`)
);

ViteExpress.bind(app, server);
