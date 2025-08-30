import { AccountsDb } from "../db/AccountsDb";
import { appUrl } from "../consts";
import { VizPlayer } from "../../types/VizPlayer";
import { Playlist } from "Viz";
import players from "../../players";
import { tokenPath } from "../../consts";
import { google, type youtube_v3, Auth } from "googleapis";

const youtubeApi = google.youtube("v3");
const clientId = process.env.YOUTUBE_CLIENT_ID;
const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
const redirectUri = new URL(tokenPath(players.youtube.id), appUrl).href;

const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  redirectUri
);

export default class YouTubePlayer implements VizPlayer {
  #account;

  constructor(accountId?: string) {
    this.#account = AccountsDb.account(accountId);
    if (!this.#account) {
      throw new Error(
        `YouTube account ${accountId} not found or not logged in`
      );
    }
  }

  async getProfile(oauth2Client: Auth.OAuth2Client) {
    try {
      const channelResult = await youtubeApi.channels.list({
        auth: oauth2Client,
        part: ["snippet", "contentDetails", "contentOwnerDetails"],
        mine: true,
        maxResults: 50,
      });

      const channelInfo = channelResult.data.items?.[0];

      if (!channelInfo)
        throw new Error("Google account has no YouTube Channel");

      return {
        id: channelInfo.id,
        displayName: channelInfo.snippet.customUrl,
        profileUrl: `https://www.youtube.com/${channelInfo.snippet.customUrl}`,
      };
    } catch (error) {
      console.error(error);
      return Promise.reject(error);
    }
  }

  async login(code: string, refresh?: boolean) {
    try {
      if (refresh) {
        await oauth2Client.refreshAccessToken();
      }

      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.credentials = tokens;

      const { id, displayName, profileUrl } =
        await this.getProfile(oauth2Client);

      AccountsDb.add(id, {
        id,
        displayName,
        profileUrl,
        player: players.youtube.id,
        token: tokens.access_token,
        isLoggedIn: true,
        refreshToken: tokens.refresh_token || this.#account.refreshToken,
      });
    } catch (error) {
      console.error(error);
      return Promise.reject(error);
    }
  }

  static authorize() {
    const scopes = ["https://www.googleapis.com/auth/youtube.readonly"];
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "select_account",
    });

    return authUrl;
  }

  async #refreshAndUpdateToken() {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      if (!credentials.access_token) {
        throw new Error();
      }
      AccountsDb.add(this.#account.id, {
        ...this.#account,
        token: credentials.access_token,
        isLoggedIn: true,
      });
      oauth2Client.credentials.access_token = credentials.access_token;
    } catch (error) {
      AccountsDb.add(this.#account.id, {
        ...this.#account,
        isLoggedIn: false,
      });
      throw new Error("YouTube credentials expired. Please log in again.");
    }
  }

  // TODO pagination
  async getPlaylists() {
    const maxResults = 50;

    oauth2Client.credentials = {
      refresh_token: this.#account.refreshToken,
      access_token: this.#account.token,
    };

    await this.#refreshAndUpdateToken();

    try {
      const { data } = await youtubeApi.playlists.list({
        auth: oauth2Client,
        part: ["snippet"],
        mine: true,
        maxResults,
      });

      return {
        // offset: data.resultsPerPage and some math,
        // total: data.totalResults,
        items: data.items.map((item) => ({
          id: item.id,
          name: item.snippet.title,
          total: null as null,
        })),
      };
    } catch (error) {
      console.error(error);
      return Promise.reject(error);
    }
  }

  async getPlaylist(playlistId: string): Promise<Playlist> {
    const maxResults = 50;

    oauth2Client.credentials = {
      refresh_token: this.#account.refreshToken,
      access_token: this.#account.token,
    };

    await this.#refreshAndUpdateToken();

    try {
      // Get playlist name from playlists.list
      const { data } = await youtubeApi.playlists.list({
        auth: oauth2Client,
        id: [playlistId],
        part: ["snippet"],
      });
      const playlistName = data.items[0].snippet.title;
      const allItems: youtube_v3.Schema$PlaylistItem[] = [];

      const fetchPlaylistItems = async (params = {}) => {
        const { data } = await youtubeApi.playlistItems.list({
          playlistId,
          auth: oauth2Client,
          part: ["snippet"],
          maxResults,
          ...params,
        });

        const nextPageToken = data.nextPageToken;
        allItems.push(...data.items);

        if (nextPageToken) {
          return await fetchPlaylistItems({
            pageToken: nextPageToken,
          });
        }

        return allItems;
      };

      const items: youtube_v3.Schema$PlaylistItem[] =
        await fetchPlaylistItems();

      const allTracks = items.map((item) => ({
        id: item.id,
        player: players.youtube.id,
        artists: [item.snippet.videoOwnerChannelTitle],
        name: item.snippet.title,
        playerUrl: `https://youtu.be/${item.snippet.resourceId.videoId}`,
        videoId: item.snippet.resourceId.videoId,
        addedAt: new Date(item.snippet.publishedAt).getTime(),
      }));

      return {
        id: playlistId,
        name: playlistName,
        tracks: allTracks,
        player: players.youtube.id,
        account: this.#account,
      };
    } catch (error) {
      console.error(error);
      return Promise.reject(error);
    }
  }
}
