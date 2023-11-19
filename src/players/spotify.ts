import axios from "axios";
import { appPort, appUrl, playersApiKeys, redirectEndpoint } from "../consts";
import type {
  AuthState,
  GetToken,
  GetQueue,
  GetCurrentlyPlaying
} from './types'
// } from 'VizPlayer'

const state: AuthState = {
  token: null,
  refreshToken: null
}

const spotifyAxios = axios.create(
  // {
  //   baseURL: "https://api.spotify.com/v1/",
  // }
);

const tokenUrl = "https://accounts.spotify.com/api/token"

// Request interceptor for API calls
spotifyAxios.interceptors.request.use(
  async config => {
    config.headers.Authorization = config.headers.Authorization || `Bearer ${state.token}`
    return config;
  },
  error => {
    Promise.reject(error)
  }
);

// Response interceptor for API calls
spotifyAxios.interceptors.response.use((response) => {
  return response
}, async function (error) {
  const originalRequest = error.config;
  if (error.response.status === 401 && !originalRequest._retry) {
    console.log('token expired. getting new one.')
    originalRequest._retry = true;
    await refreshAccessToken();
    axios.defaults.headers.common['Authorization'] = 'Bearer ' + state.token;
    return spotifyAxios(originalRequest);
  }
  return Promise.reject(error);
});

const refreshAccessToken = async () => {
  const { clientId, clientSecret } = playersApiKeys.spotify;
  const { refreshToken } = state;

  const { data } = await axios.post(
    tokenUrl,
    {
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId
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

  state.token = data.access_token
  state.refreshToken = data.refresh_token
};

const getToken: GetToken = async (req) => {
  const { clientId, clientSecret } = playersApiKeys.spotify;
  const { data } = await spotifyAxios.post(
    tokenUrl,
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

  state.token = data.access_token
  state.refreshToken = data.refresh_token

  return data;
};

const getQueue: GetQueue = async (req) => {
  try {
    const { data } = await spotifyAxios.get<SpotifyApi.UsersQueueResponse>(
      "https://api.spotify.com/v1/me/player/queue"
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

const getCurrentlyPlaying: GetCurrentlyPlaying = async (req) => {
  try {
    const { data } = await spotifyAxios.get<SpotifyApi.CurrentPlaybackResponse>(
      "https://api.spotify.com/v1/me/player",
    );

    // if (!data.item) return {};

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
    };
  } catch (error) {
    return Promise.reject(error);
  }
}

export const spotify = {
  getToken,
  getQueue,
  getCurrentlyPlaying
};