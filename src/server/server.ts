import express, { Request } from "express";
import compression from "compression";
import { readdirSync, rmSync } from "fs";
import ViteExpress from "vite-express";
import {
  url,
  appIp,
  appUrl,
  appPort,
  hlsDir,
} from "../consts.ts";
import { HttpStatusCode } from "axios";
import { vizM3u8 } from "./vizM3u8.ts";
import { QueuesDb, queuesDbEvents } from "./db/QueuesDb.ts";
import { VideosDb } from "./db/VideosDb.ts";
import { PrefsDb } from "./db/PrefsDb.ts";
import type { Queue } from 'Viz'

const app = express();
app.use(express.json());
app.use(compression());


const getVideo = async ({ artist, name, queueId, queueItemId }: {
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

const queueDownload = () => {
  QueuesDb.downloadableQueue(1).forEach((item) => {
    const artist = item.track.artists[0]
    const name = item.track.name
    const queueId = QueuesDb.currentQueue.id
    const queueItemId = item.id

    getVideo({ artist, name, queueId, queueItemId })
  })
}

const queueUpdateFromPlaylist = async () => {
  const latestAddedAt = Math.max(...QueuesDb.currentQueue.items.map(item => item.track.addedAt))
  const playlist = await PrefsDb.player.getPlaylist(
    QueuesDb.currentQueue.playlist.id
  );

  const newTracks = playlist.tracks.filter(track => track.addedAt > latestAddedAt)
  const newItems = newTracks.map(track => {
    return { track, videoId: null }
  })

  QueuesDb.addItems(QueuesDb.currentQueue.id, newItems)
}

// Player

app.get(url.authorize, (_, res) => {
  const redirectUrl = PrefsDb.player.authorize();
  res.redirect(redirectUrl);
});

app.get(url.token, async (req, res) => {
  await PrefsDb.player.getToken(req);

  res.cookie("isLoggedIn", true);
  res.redirect(appUrl);
});

app.post(url.api.logout, async (_, res) => {
  await PrefsDb.player.logout();
  res.sendStatus(HttpStatusCode.NoContent)
});

app.get(url.api.playlists, async (_, res) => {
  const playlists = await PrefsDb.player.getPlaylists();
  res.json(playlists);
});

app.get(url.api.playlist(), async (req, res) => {
  const { playlistId } = req.params;
  const playlist = await PrefsDb.player.getPlaylist(playlistId);
  res.json(playlist);
});

// Video streaming

app.delete(url.api.videos, async (_, res) => {
  VideosDb.delete()
  readdirSync(hlsDir).forEach(f => rmSync(`${hlsDir}/${f}`, { recursive: true }));

  return res.sendStatus(HttpStatusCode.NoContent);
});

app.post(url.api.video, async (req, res) => {
  const { artist, name, queueId, queueItemId } = req.body;

  res
    .status(HttpStatusCode.Created)
    .json(getVideo({ artist, name, queueId, queueItemId }));
});

app.get(url.api.m3u, async (_, res) => {
  // TODO confirm sending as gzip ?
  const m3u8 = vizM3u8()

  return res
    .type("application/vnd.apple.mpegurl")
    .send(m3u8);
});

// app.get(url.api.ts(), async (req, res) => {
//   const { videoId, segmentIndex } = req.params;

//   const stream = createReadStream(tsPath(videoId, segmentIndex), {
//     highWaterMark: 64 * 1024, // TODO adjust?
//   });
//   res.setHeader('Content-Type', 'video/mp2t');
//   return stream.pipe(res);
// });

// Queue

app.post(url.api.play, async (_, res) => {
  QueuesDb.startTime = Date.now()
  res.sendStatus(HttpStatusCode.Ok)
});

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
  QueuesDb.delete()
  return res.sendStatus(HttpStatusCode.Ok);
});

app.post(url.api.queueDownload, async (_, res) => {
  queueDownload()
  queueUpdateFromPlaylist()

  // queuesDbEvents.on('downloadComplete', queueDownload);
  // from QueuesDb: queuesDbEvents.emit('downloadComplete');
  // or based on current play position?
  // + cancellable fn/endpoint
  setInterval(() => {
    queueDownload()
    queueUpdateFromPlaylist()
  }, 10_000)
  return res.sendStatus(HttpStatusCode.Ok); // TODO NoContent?
});

app.delete(url.api.queueItem(), (
  req: Request<{ queueId: string, queueItemId: string }>,
  res
) => {
  const { queueId, queueItemId } = req.params;
  QueuesDb.removeItem(queueId, queueItemId)

  return res.sendStatus(HttpStatusCode.NoContent);
})


app.post(url.api.queueId(), async (req: {
  body: Partial<Queue>,
  params: { queueId: string }
}, res) => {
  const { queueId } = req.params;
  const { items, playlist } = req.body

  QueuesDb.addItems(queueId, items)
  QueuesDb.editQueue(queueId, { playlist })

  return res.sendStatus(HttpStatusCode.Ok);
});

const server = app.listen(appPort, appIp, () =>
  console.log(`viz running at ${appUrl}`)
);

ViteExpress.bind(app, server);
