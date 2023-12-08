import axios from "axios";
import querystring from "node:querystring";
import { appUrl, url } from "../consts";
import type { GetToken, GetPlaylist, GetPlaylists } from "VizPlayer";
import { AuthDb } from "../db/AuthDb";

const clientId = process.env.SPOTIFY_CLIENT_ID
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

const spotifyAxios = axios.create();
const SPOTIFY = <const>'spotify';

// Request interceptor for API calls
spotifyAxios.interceptors.request.use(
  async config => {
    config.headers.Authorization = config.headers.Authorization || `Bearer ${AuthDb.player(SPOTIFY).token}`
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
    console.log('Getting refresh token...')
    originalRequest._retry = true;
    await getRefreshToken();
    originalRequest.headers.Authorization = `Bearer ${AuthDb.player(SPOTIFY).token}`
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
          refresh_token: AuthDb.player(SPOTIFY).refreshToken,
          client_id: clientId
        }
        : {
          grant_type: "authorization_code",
          code: req.query.code,
          redirect_uri: new URL(url.token, appUrl).href,
        },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64"),
        },
      }
    );

    AuthDb.editAuth(SPOTIFY, {
      token: data.access_token,
      refreshToken: data.refresh_token || AuthDb.player(SPOTIFY).refreshToken,
    })

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
      redirect_uri: new URL(url.token, appUrl).href
    })
}

const logout = async () => {
  AuthDb.clearAuth(SPOTIFY)
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
        total: tracks.total,
      }))
    }
  } catch (error) {
    return Promise.reject(error);
  }
}

const getPlaylist: GetPlaylist = async (playlistId) => {
  const itemsMaxLimit = 50

  try {
    const { data: { name, tracks: { total } } } = await spotifyAxios.get<SpotifyApi.PlaylistObjectFull>(
      `https://api.spotify.com/v1/playlists/${playlistId}`, {
      params: {
        fields: 'name,tracks.total'
      }
    })

    const callsCount = Math.ceil(total / itemsMaxLimit)
    const offsets = [...Array(callsCount).keys()]

    const playlistTrackResponses = await Promise.all(
      offsets.map(offset => spotifyAxios.get<SpotifyApi.PlaylistTrackResponse>(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        params: {
          offset: offset * itemsMaxLimit,
          limit: itemsMaxLimit,
          fields: 'items(added_at,track(id,name,artists,external_urls))'
        }
      }))
    )

    const allTracks = playlistTrackResponses.flatMap(({ data }) => {
      return data.items.map(item => ({
        id: item.track.id,
        player: SPOTIFY,
        artists: item.track.artists.map(artist => artist.name),
        name: item.track.name,
        playerUrl: item.track.external_urls.spotify,
        addedAt: (new Date(item.added_at)).getTime()
      }))
    })

    return {
      id: playlistId,
      name,
      tracks: allTracks,
      player: SPOTIFY
    }
  } catch (error) {
    return Promise.reject(error);
  }
}

export const spotify = {
  getToken,
  authorize,
  logout,
  getPlaylists,
  getPlaylist
};