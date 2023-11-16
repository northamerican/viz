import axios from "axios";
import fs from "fs";
import {
  appPort,
  appUrl,
  maxVideoDuration,
  playersApiKeys,
  redirectEndpoint,
} from "./consts.mjs";
import ytdlMuxer from "./ytdl-muxer.mjs";
import { mp4Dir } from "./consts.mjs";
import ytsr from "ytsr";

function durationToSeconds(duration) {
  return duration.split(":").reduce((acc, time) => 60 * acc + +time, 0);
}

const sources = {
  youtube: {
    createSearchQuery: (track) => {
      const { artist, title } = track;

      // TODO logic here, removing text beyond a dash or inside parens (ex: rework, remix?, remaster,)

      return `${artist} ${title} music video`;
    },
    getVideo: async (query) => {
      const filters1 = await ytsr.getFilters(query);
      const filter1 = filters1.get("Type").get("Video");
      const { items } = await ytsr(filter1.url, {
        safeSearch: false,
        limit: 20,
      });

      const filterItems = items.filter(
        // @ts-ignore
        ({ duration }) => {
          return duration && durationToSeconds(duration) < maxVideoDuration;
        }
        // TODO logic here, filtering out unwanted videos
      );

      if (!filterItems.length) return null;

      // @ts-ignore
      const { id: videoId, url } = filterItems[0];
      const video = ytdlMuxer(url);

      return { video, videoId };
    },
  },
};

const players = {
  // TODO move to /players/spotify
  spotify: {
    requestConfig: ({ accessToken }) => ({
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),
    // api: ({ accessToken }) =>
    //   axios.create({
    //     baseURL: "https://api.spotify.com/v1/",
    //     headers: {
    //       Authorization: `Bearer ${accessToken}`,
    //     },
    //   }),
    getToken: async (req) => {
      const { clientId, clientSecret } = playersApiKeys.spotify;
      const { data } = await axios.post(
        "https://accounts.spotify.com/api/token",
        {
          grant_type: "authorization_code",
          code: req.query.code,
          redirect_uri: `http://${appUrl}:${appPort}${redirectEndpoint}`,
        },
        {
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            Authorization:
              "Basic " +
              Buffer.from(clientId + ":" + clientSecret).toString("base64"),
          },
        }
      );

      return data;
    },
    getQueue: async (accessToken) => {
      try {
        const { data } = await axios.get(
          "https://api.spotify.com/v1/me/player/queue",
          players.spotify.requestConfig({ accessToken })
        );

        if (!data.currently_playing) return [];

        return [data.currently_playing, ...data.queue].map((track) => ({
          id: track.id,
          artist: track.artists[0].name,
          title: track.name,
        }));
      } catch (error) {
        return Promise.reject(error);
      }
    },
    getCurrentlyPlaying: async (accessToken) => {
      try {
        const { data } = await axios.get(
          "https://api.spotify.com/v1/me/player",
          players.spotify.requestConfig({ accessToken })
        );

        if (!data.item) return {};

        return {
          duration_ms: data.duration_ms,
          shuffle_state: data.shuffle_state,
          progress_ms: data.progress_ms,
          id: data.item.id,
          artist: data.item.artists[0].name,
          title: data.item.name,
          is_playing: data.is_playing,
        };
      } catch (error) {
        return Promise.reject(error);
      }
    },
  },
};

function queueVideo(video, id) {
  // read and compare current track and queue

  // read and write from app state (or mongo?)
  // the positions and queue
  const videoQueue = {
    playhead: 125000,
    items: [
      {
        videoId: "Qr5AIKRPIHo",
        start: 0,
        end: 300000,
      },
      {
        videoId: "RwlZ0UWy_as",
        start: 300000,
        end: 600000,
      },
    ],
    // downloading: [] ?
  };

  // events
  // from some polling fn:
  // song change on spotify. with id,
  // move video playhead to start of song
  // next song in queue
}

function writeVideoStream(video, id) {
  const videoPath = mp4Dir + `${id}.mp4`;
  video.pipe(fs.createWriteStream(videoPath));

  return video;
}

export { sources, players, writeVideoStream };
