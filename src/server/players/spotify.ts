import axios from "axios";
import querystring from "node:querystring";
import { AccountsDb } from "../db/AccountsDb";
import { appUrl } from "../consts";
import { VizPlayer } from "../../types/VizPlayer";
import type { TrackType } from "Viz";
import players from "../../players";
import { tokenPath } from "../../consts";

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const redirectUri = new URL(tokenPath(players.spotify.id), appUrl).href;

export default class SpotifyPlayer implements VizPlayer {
  #account;
  #axios;

  constructor(accountId?: string) {
    this.#account = AccountsDb.account(accountId);
    this.#axios = axios.create();

    this.#axios.interceptors.request.use(
      async (config) => {
        config.headers.Authorization ||= `Bearer ${this.#account?.token}`;
        return config;
      },
      (error) => {
        Promise.reject(error);
      }
    );

    this.#axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          await this.getRefreshToken();
          originalRequest.headers.Authorization = `Bearer ${this.#account?.token}`;
          return this.#axios(originalRequest);
        }
        return Promise.reject(error);
      }
    );
  }

  async getProfile(token: string) {
    try {
      const { data } =
        await this.#axios.get<SpotifyApi.CurrentUsersProfileResponse>(
          "https://api.spotify.com/v1/me",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      return {
        id: data.id,
        displayName: data.display_name,
        profileUrl: data.external_urls.spotify,
      };
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async login(code: string, refresh?: boolean) {
    try {
      const { data } = await this.#axios.post(
        "https://accounts.spotify.com/api/token",
        refresh
          ? {
              grant_type: "refresh_token",
              refresh_token: this.#account.refreshToken,
              client_id: clientId,
            }
          : {
              grant_type: "authorization_code",
              code,
              redirect_uri: redirectUri,
            },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization:
              "Basic " +
              Buffer.from(clientId + ":" + clientSecret).toString("base64"),
          },
        }
      );

      const { id, displayName, profileUrl } = await this.getProfile(
        data.access_token
      );

      AccountsDb.edit(id, {
        id,
        displayName,
        profileUrl,
        player: players.spotify.id,
        token: data.access_token,
        isLoggedIn: true,
        refreshToken: data.refresh_token || this.#account.refreshToken,
      });
    } catch (error) {
      Promise.reject(error);
    }
  }

  // TODO remove - just put the body of this fn where it is used
  async getRefreshToken() {
    return this.login(null, true);
  }

  static authorize() {
    const scope = "user-read-private user-read-email playlist-read-private";

    return (
      "https://accounts.spotify.com/authorize?" +
      querystring.stringify({
        response_type: "code",
        client_id: clientId,
        scope: scope,
        redirect_uri: redirectUri,
      })
    );
  }

  // TODO Move these? dupes
  async logout() {
    await AccountsDb.logout(this.#account.id);
  }
  async remove() {
    await AccountsDb.remove(this.#account.id);
  }

  // TODO pagination
  async getPlaylists(offset = 0) {
    try {
      const { data } =
        await this.#axios.get<SpotifyApi.ListOfCurrentUsersPlaylistsResponse>(
          "https://api.spotify.com/v1/me/playlists",
          {
            params: {
              offset,
            },
          }
        );

      return {
        // offset,
        // total,
        items: data.items.map(({ id, name, tracks }) => ({
          id,
          name,
          total: tracks.total,
        })),
      };
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async getPlaylist(playlistId: string) {
    const itemsMaxLimit = 50;

    try {
      const {
        data: {
          name,
          tracks: { total },
        },
      } = await this.#axios.get<SpotifyApi.PlaylistObjectFull>(
        `https://api.spotify.com/v1/playlists/${playlistId}`,
        {
          params: {
            fields: "name,tracks.total",
          },
        }
      );

      const callsCount = Math.ceil(total / itemsMaxLimit);
      const offsets = [...Array(callsCount).keys()];

      const playlistTrackResponses = await Promise.all(
        offsets.map((offset) =>
          this.#axios.get<SpotifyApi.PlaylistTrackResponse>(
            `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
            {
              params: {
                offset: offset * itemsMaxLimit,
                limit: itemsMaxLimit,
                fields: "items(added_at,track(id,name,artists,external_urls))",
              },
            }
          )
        )
      );

      const allTracks = playlistTrackResponses.flatMap(({ data }) => {
        return data.items.map((item) => ({
          id: item.track.id,
          player: players.spotify.id,
          artists: item.track.artists.map((artist) => artist.name),
          name: item.track.name,
          playerUrl: item.track.external_urls.spotify,
          addedAt: new Date(item.added_at).getTime(),
          type: "track" as TrackType,
        }));
      });

      return {
        id: playlistId,
        name,
        tracks: allTracks,
        player: players.spotify.id,
        account: this.#account,
      };
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
