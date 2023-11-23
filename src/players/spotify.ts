import axios from "axios";
import querystring from "node:querystring";
import { join } from "path";
import { appUrl, dbDir, playersApiKeys, redirectEndpoint } from "../consts";
import type {
  GetToken,
  GetQueue,
  GetCurrentlyPlaying
} from '../types/players'
import { JSONPreset } from "lowdb/node";
import { AuthState } from "../types/viz";

// TODO make spotify-specific?
const auth = await JSONPreset<AuthState>(join(dbDir, 'auth.json'), {
  token: null,
  refreshToken: null
})

const spotifyAxios = axios.create();

// Request interceptor for API calls
spotifyAxios.interceptors.request.use(
  async config => {
    config.headers.Authorization = config.headers.Authorization || `Bearer ${auth.data.token}`
    return config;
  },
  error => {
    Promise.reject(error)
  }
);

spotifyAxios.interceptors.response.use((response) => {
  return response
}, async function (error) {
  const originalRequest = error.config;

  if (error.response.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true;
    await getRefreshToken();
    return spotifyAxios(originalRequest);
  }
  return Promise.reject(error);
});

const getToken: GetToken = async (req, refresh) => {
  const { clientId, clientSecret } = playersApiKeys.spotify;
  try {
    const { data } = await spotifyAxios.post(
      "https://accounts.spotify.com/api/token",
      refresh ?
        {
          grant_type: "refresh_token",
          refresh_token: auth.data.refreshToken,
          client_id: clientId
        }
        : {
          grant_type: "authorization_code",
          code: req.query.code,
          redirect_uri: new URL(redirectEndpoint, appUrl).href,
        },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64"),
        },
      }
    );

    auth.data = {
      token: data.access_token,
      refreshToken: data.refresh_token || auth.data.refreshToken,
    }
    auth.write()

    return data;
  } catch (error) {
    console.log(error)
  }
};

const getRefreshToken = getToken.bind(this, null, true)

const authorize = () => {
  const { clientId } = playersApiKeys.spotify;
  const scope =
    "user-read-private user-read-email user-read-currently-playing user-read-playback-state";

  return "https://accounts.spotify.com/authorize?" +
    querystring.stringify({
      response_type: "code",
      client_id: clientId,
      scope: scope,
      redirect_uri: new URL(redirectEndpoint, appUrl).href
    })
}

const logout = async () => {
  auth.data = {
    token: null,
    refreshToken: null
  }
  auth.write()
}

const getQueue: GetQueue = async () => {
  try {
    const { data } = await spotifyAxios.get<SpotifyApi.UsersQueueResponse>(
      "https://api.spotify.com/v1/me/player/queue"
    );

    if (!data.currently_playing) return [];

    // TODO handle podcast playing
    // if (data.currently_playing.type === 'episode') {
    //   return []
    // }

    return [
      data.currently_playing as SpotifyApi.TrackObjectFull,
      ...data.queue as SpotifyApi.TrackObjectFull[]
    ].map((track) => ({
      id: track.id,
      artist: track.artists?.[0].name,
      title: track.name,
    }));
  } catch (error) {
    return Promise.reject(error);
  }
}

// @ts-ignore
const getCurrentlyPlaying: GetCurrentlyPlaying = async () => {
  try {
    const { data } = await spotifyAxios.get<SpotifyApi.CurrentPlaybackResponse>(
      "https://api.spotify.com/v1/me/player",
    );

    if (!data.item) return {};

    return {
      id: data.item.id,
      // @ts-ignore
      artist: data.item.artists[0].name,
      title: data.item.name,
      // @ts-ignore
      durationMs: data.duration_ms,
      progressMs: data.progress_ms,
      shuffleState: data.shuffle_state,
      isPlaying: data.is_playing,
    }
  } catch (error) {
    return Promise.reject(error);
  }
}

export const spotify = {
  getToken,
  authorize,
  logout,
  getQueue,
  getCurrentlyPlaying
};