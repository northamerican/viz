import express from "express";
import compression from "compression";
import { createReadStream, readdirSync, rmSync } from "fs";
import ViteExpress from "vite-express";
import {
  url,
  appIp,
  appUrl,
  appPort,
  tsPath,
  hlsDir,
} from "./consts.ts";
import { HttpStatusCode, isAxiosError } from "axios";
import { VizM3u8 } from "./VizM3u8.ts";
import { QueuesDb, queuesDbEvents } from "./db/QueuesDb.ts";
import { VideosDb } from "./db/VideosDb.ts";
import { PrefsDb } from "./db/PrefsDb.ts";
import type { Queue } from 'Viz'

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

    res.sendStatus(HttpStatusCode.NoContent)
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

    return res.sendStatus(HttpStatusCode.NoContent);
  } catch (error) {
    return res.sendStatus(HttpStatusCode.InternalServerError);
  }
});

const downloadVideo = async ({ artist, name, queueId, queueItemId }: {
  artist: string;
  name: string;
  queueId: string;
  queueItemId: string;
}) => {
  console.log(`Getting video for ${name} - ${artist}`)
  const searchQuery = PrefsDb.source.createSearchQuery({ artist, name });
  const { videoId, url } = await PrefsDb.source.getVideoUrl(searchQuery);
  await PrefsDb.source.writeVideo({ videoId, url })

  QueuesDb.editItem(queueId, queueItemId, { videoId })

  return { videoId }
}

app.post(url.api.video, async (req, res) => {
  const { artist, name, queueId, queueItemId } = req.body;

  res
    .status(HttpStatusCode.Created)
    .json(downloadVideo({ artist, name, queueId, queueItemId }));
});

app.get(url.api.m3u, async (_, res) => {
  // TODO confirm sending as gzip ?
  try {
    const m3u8 = VizM3u8()

    return res
      .type("application/vnd.apple.mpegurl")
      .send(m3u8);
  } catch (error) {
    return res.sendStatus(HttpStatusCode.InternalServerError);
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
    return res.sendStatus(HttpStatusCode.InternalServerError);
  }
});

// Queue

app.post(url.api.play, async (_, res) => {
  try {
    QueuesDb.startTime = Date.now()
    res.sendStatus(HttpStatusCode.Ok)
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

  res.writeHead(HttpStatusCode.Ok, {
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

    return res.sendStatus(HttpStatusCode.Ok);
  } catch (error) {
    return res.sendStatus(HttpStatusCode.InternalServerError);
  }
});

app.post(url.api.queueId(':queueId'), async (req: {
  body: Partial<Queue>,
  params: { queueId: string }
}, res) => {
  try {
    const { queueId } = req.params;
    const { items, player, playlistId } = req.body
    QueuesDb.addItems(queueId, items)
    QueuesDb.editQueue(queueId, { player, playlistId })

    return res.sendStatus(HttpStatusCode.Ok);
  } catch (error) {
    return res.sendStatus(HttpStatusCode.InternalServerError);
  }
});

const queueDownload = () => {
  QueuesDb.downloadableQueue(1).forEach((item) => {
    const artist = item.track.artists[0]
    const name = item.track.name
    const queueId = QueuesDb.currentQueue.id
    const queueItemId = item.id

    downloadVideo({ artist, name, queueId, queueItemId })
  })
}

app.post(url.api.queueDownload, async (_, res) => {
  try {
    // TODO check for playlist updates from player here 

    queueDownload()
    // TODO instead 
    // queuesDbEvents.on('downloadComplete', queueDownload);
    // from QueuesDb: queuesDbEvents.emit('downloadComplete');
    // or based on current play position
    // + cancellable fn/endpoint
    setInterval(queueDownload, 10_000)
    return res.sendStatus(HttpStatusCode.Ok); // TODO NoContent?
  } catch (error) {
    return res.sendStatus(HttpStatusCode.InternalServerError);
  }
});

app.delete(url.api.queueItem(':queueId', ':queueItemId'), (req, res) => {
  const { queueId, queueItemId } = req.params;
  QueuesDb.removeItem(queueId, queueItemId)

  return res.sendStatus(HttpStatusCode.NoContent);
})

const server = app.listen(appPort, appIp, () =>
  console.log(`viz running at ${appUrl}`)
);

ViteExpress.bind(app, server);
