import axios from "axios";
import querystring from "node:querystring";
import { join } from "path";
import { appUrl, dbDir, redirectEndpoint } from "../consts";
import { JSONPreset } from "lowdb/node";
import type { AuthStateDbType } from "Viz";
import type { GetToken, GetPlaylist, GetPlaylists } from "VizPlayer";
import { VideosDb } from "../VideosDb";

const clientId = process.env.SPOTIFY_CLIENT_ID
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

// TODO make spotify-specific?
const auth = await JSONPreset<AuthStateDbType>(join(dbDir, 'auth.json'), {
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

const getRefreshToken = () => getToken(null, true)

const authorize = () => {
  const scope =
    "user-read-private user-read-email playlist-read-private";

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

// TODO pagination
const getPlaylists: GetPlaylists = async (offset = 0) => {
  try {
    const { data } = await spotifyAxios.get<SpotifyApi.ListOfCurrentUsersPlaylistsResponse>(
      "https://api.spotify.com/v1/me/playlists", {
      params: {
        offset
      }
    });

    return {
      // offset,
      // total,
      items: data.items.map(({ id, name, tracks }) => ({
        id,
        name,
        total: tracks.total
      }))
    }
  } catch (error) {
    return Promise.reject(error);
  }
}

const getPlaylist: GetPlaylist = async (playlistId, total) => {
  const itemsMaxLimit = 50
  const callsCount = Math.ceil(total / itemsMaxLimit)
  const offsets = [...Array(callsCount).keys()]

  // console.log({ offsets })

  try {
    const [playlistObjectFullResponse, ...playlistTrackResponses] = await Promise.all([
      // This call returns the playlist name
      spotifyAxios.get<SpotifyApi.PlaylistObjectFull>(
        `https://api.spotify.com/v1/playlists/${playlistId}`, {
      }),
      // These return all tracks info
      ...offsets.map(offset => spotifyAxios.get<SpotifyApi.PlaylistTrackResponse>(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        params: {
          offset,
          limit: itemsMaxLimit,
          fields: 'offset,total,items(track(id,name,artists))'
        }
      }))])

    const allTracks = playlistTrackResponses.flatMap(({ data }) => {
      return data.items.map(item => ({
        artists: item.track.artists.map(artist => artist.name),
        title: item.track.name
      }))
    })

    return {
      id: playlistId,
      name: playlistObjectFullResponse.data.name,
      tracks: allTracks
    }
  } catch (error) {
    return Promise.reject(error);
  }
}

const playPlaylist = async () => {
  VideosDb.setStartTime();
}

export const spotify = {
  getToken,
  authorize,
  logout,
  getPlaylists,
  getPlaylist,
  playPlaylist
};