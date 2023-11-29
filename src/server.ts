import express from "express";
import compression from "compression";
import { createReadStream } from "fs";
import ViteExpress from "vite-express";
import {
  endpoints,
  appUrl,
  appPort,
  appIp,
  tsPath,
} from "./consts.ts";
import { isAxiosError } from "axios";
import { VizM3u8 } from "./VizM3u8.ts";
import { QueuesDb } from "./db/QueuesDb.ts";
import { PrefsDb } from "./db/PrefsDb.ts";

const app = express();
app.use(compression());
app.use(express.json());

// Player

app.get(endpoints.authorize, (_, res) => {
  try {
    const redirectUrl = PrefsDb.player.authorize();

    res.redirect(redirectUrl);
  } catch (e) {
    console.log(e)
  }
});

app.get(endpoints.token, async (req, res) => {
  try {
    await PrefsDb.player.getToken(req);

    res.cookie("isLoggedIn", true);
    res.redirect(appUrl);
  } catch (e) {
    console.log(`${endpoints.token} failed.`)
  }
});

app.get(endpoints.api.logout, async (_, res) => {
  try {
    await PrefsDb.player.logout();

    res.sendStatus(204)
  } catch (error) {
    if (isAxiosError(error)) {
      res.sendStatus(error.response.status);
    }
  }
});

app.get(endpoints.api.playlists, async (_, res) => {
  try {
    const playlists = await PrefsDb.player.getPlaylists();

    res.json(playlists);
  } catch (error) {
    if (isAxiosError(error)) {
      res.sendStatus(error.response.status);
    }
  }
});

app.get(endpoints.api.playlist(':playlistId'), async (req, res) => {
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

app.post(endpoints.api.video, async (req, res) => {
  const { artist, title, queueId, queueItemId } = req.body;

  console.log(`Getting video for ${title} - ${artist}`)
  const searchQuery = PrefsDb.source.createSearchQuery({ artist, title });
  const { video, videoId } = await PrefsDb.source.getVideo(searchQuery);

  // TODO Probably move this?
  QueuesDb.editItem(queueId, queueItemId, { videoId })

  await PrefsDb.source.writeVideoStream(video, videoId);

  res.status(201).json({ videoId });
});

// TODO rename join('api', 'video-stream')
app.get(endpoints.api.m3u, async (_, res) => {
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

app.get(endpoints.api.ts(':videoId', ':segmentIndex'), async (req, res) => {
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

app.post(endpoints.api.play, async (_, res) => {
  try {
    QueuesDb.startTime = Date.now()
    res.sendStatus(200)
  } catch (error) {
  }
});

app.get(endpoints.api.current, async (_, res) => {
  // long polling
  // const watcher = fs.watch(queuesDbPath, { signal });
  // for await (const event of watcher) {
  //   res...
  // }

  try {
    return res.json(QueuesDb.currentQueueWithVideos);
  } catch (error) {
    return res.sendStatus(500);
  }
});

app.post(endpoints.api.queue, async (req, res) => {
  try {
    const { items } = req.body
    QueuesDb.addItems(items)

    // return stream.pipe(res);
    return res.sendStatus(200);
  } catch (error) {
    return res.sendStatus(500);
  }
});

app.put(endpoints.api.queueId(':id'), async (req, res) => {
  try {
    // const { id } = req.params;
    // QueuesDb.addItems(items)

    // return stream.pipe(res);
    return res.sendStatus(200);
  } catch (error) {
    return res.sendStatus(500);
  }
});


const server = app.listen(appPort, appIp, () =>
  console.log(`viz running at ${appUrl}`)
);

ViteExpress.bind(app, server);
