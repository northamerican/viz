import axios from "axios";
import { appPort, appUrl, playersApiKeys, redirectEndpoint } from "../consts";
import type {
  RequestConfig,
  GetToken,
  GetQueue,
  GetCurrentlyPlaying
} from 'VizPlayer'

// const api = ({ accessToken }) =>
//   axios.create({
//     baseURL: "https://api.spotify.com/v1/",
//     headers: {
//       Authorization: `Bearer ${accessToken}`,
//     },
//   })

const requestConfig: RequestConfig = ({ accessToken }) => ({
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
})

const getToken: GetToken = async (req) => {
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
};

const getQueue: GetQueue = async (accessToken) => {
  try {
    const { data } = await axios.get<SpotifyApi.UsersQueueResponse>(
      "https://api.spotify.com/v1/me/player/queue",
      requestConfig({ accessToken })
    );

    if (!data.currently_playing) return [];

    return [
      data.currently_playing as SpotifyApi.TrackObjectFull,
      ...data.queue as SpotifyApi.TrackObjectFull[]
    ].map((track) => ({
      id: track.id,
      artist: track.artists[0].name,
      title: track.name,
    }));
  } catch (error) {
    return Promise.reject(error);
  }
}

const getCurrentlyPlaying: GetCurrentlyPlaying = async (accessToken) => {
  try {
    const { data } = await axios.get<SpotifyApi.CurrentPlaybackResponse>(
      "https://api.spotify.com/v1/me/player",
      requestConfig({ accessToken })
    );

    if (!data.item) return {};

    return {
      id: data.item.id,
      artist: data.item.artists[0].name,
      title: data.item.name,
      durationMs: data.duration_ms,
      progressMs: data.progress_ms,
      shuffleState: data.shuffle_state,
      isPlaying: data.is_playing,
    };
  } catch (error) {
    return Promise.reject(error);
  }
}

export const spotify = {
  requestConfig,
  getToken,
  getQueue,
  getCurrentlyPlaying
};