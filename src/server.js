import express from "express";
import compression from "compression";
import { promises as fs, createReadStream } from "fs";
import querystring from "node:querystring";
import ViteExpress from "vite-express";
import axios from "axios";

import { sources, players, writeVideoStream } from "./viz.mjs";
import {
  __dirname,
  playersApiKeys,
  redirectEndpoint,
  hlsDir,
  appUrl,
  appPort,
} from "./consts.mjs";

const app = express();
app.use(compression());
app.use(express.json());

const prefs = {
  // rename, move
  player: "spotify",
  source: "youtube",
};

function setToken(res, data) {
  res.cookie("token", data.access_token);
  res.cookie("refresh_token", data.refresh_token);
  res.cookie("expires", data.expires);

  app.locals.token = data.access_token;
  app.locals.refresh_token = data.refresh_token;
  app.locals.expires = data.expires;
}

app.get("/authorize", function (req, res) {
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

    setToken(res, data);
    res.redirect(`http://${appUrl}:${appPort}/`);
  } catch (e) {
    console.log(e);
  }
});

app.get("/queue", async (req, res) => {
  const { token } = req.app.locals;
  const { player } = prefs;

  if (!token) return res.status(401).send();
  try {
    const queue = await players[player].getQueue(token);

    // res.json(queue);
    res.send(JSON.stringify(queue));
  } catch (error) {
    // if 401 handleRefreshToken();
    res.status(error.response.status).send();
  }
});

app.get("/current", async (req, res) => {
  const { token } = req.app.locals;
  const { player } = prefs;

  if (!token) return res.status(401).send();

  try {
    const current = await players[player].getCurrentlyPlaying(token);

    // res.json(current);
    res.send(JSON.stringify(current));
  } catch (error) {
    // if 401 handleRefreshToken();
    console.log({ error });
    res.status(error.response.status).send();
  }
});

app.get("/video", function (req, res) {
  //
});

app.post("/video", async (req, res) => {
  const { artist, title } = req.body;
  const { source } = prefs;

  const searchQuery = sources[source].createSearchQuery({ artist, title });
  const { video, videoId } = await sources[source].getVideo(searchQuery);
  const videoStream = writeVideoStream(video, videoId);

  videoStream.on("finish", function () {
    res.status(201).send({ videoId }); //.send(JSON.stringify({ videoPath }));
  });
});

app.get("/hls/:filename.m3u8", async (req, res) => {
  const { filename } = req.params;
  try {
    const contents = await fs.readFile(`${hlsDir}/${filename}.m3u8`);
    if (!contents) return res.sendStatus(500);

    res.type("application/vnd.apple.mpegurl");
    return res.status(200).send(contents);
  } catch (error) {
    return res.sendStatus(500);
  }
});

app.get("/hls/:filename.ts", async (req, res) => {
  const { filename } = req.params;
  console.log("getting", req.path);
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
