import { AccountsDb } from "../db/AccountsDb";
import { appUrl } from "../consts";
import { VizPlayer } from "../../types/VizPlayer";
import { Playlist, TrackType } from "Viz";
import players from "../../players";
import { tokenPath } from "../../consts";
import { google, type youtube_v3, Auth } from "googleapis";

const youtubeApi = google.youtube("v3");
const clientId = process.env.YOUTUBE_CLIENT_ID;
const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
const redirectUri = new URL(tokenPath(players.youtube.id), appUrl).href;

export default class YouTubePlayer implements VizPlayer {
  #account;

  constructor(accountId?: string) {
    this.#account = AccountsDb.account(accountId);

    // TODO check if refresh token needed here?
  }

  async getProfile(oauth2Client: Auth.OAuth2Client) {
    try {
      const channelResult = await youtubeApi.channels.list({
        auth: oauth2Client,
        part: ["snippet", "contentDetails", "contentOwnerDetails"], // TODO test w snippet only
        mine: true,
        maxResults: 50,
      });

      const channelInfo = channelResult.data.items[0];

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
    // TODO move to constructor
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    if (refresh) {
      await oauth2Client.refreshAccessToken();
    }

    try {
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.credentials = tokens;

      const { id, displayName, profileUrl } =
        await this.getProfile(oauth2Client);

      AccountsDb.edit(id, {
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
      Promise.reject(error);
    }
  }

  // TODO this is not called from anywhere
  async getRefreshToken() {
    return this.login(null, true);
  }

  static authorize() {
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );
    const scopes = ["https://www.googleapis.com/auth/youtube.readonly"];
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
    });

    return authUrl;
  }

  // TODO Move these? dupes
  async logout() {
    await AccountsDb.logout(this.#account.id);
  }
  async remove() {
    await AccountsDb.remove(this.#account.id);
  }

  // TODO pagination
  async getPlaylists() {
    const maxResults = 50;

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );
    oauth2Client.credentials = {
      refresh_token: this.#account.refreshToken,
      access_token: this.#account.token,
    };

    await oauth2Client.refreshAccessToken();

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
          total: null,
        })),
      };
    } catch (error) {
      console.error(error);
      return Promise.reject(error);
    }
  }

  async getPlaylist(playlistId: string): Promise<Playlist> {
    const maxResults = 50;

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );
    oauth2Client.credentials = {
      refresh_token: this.#account.refreshToken,
      access_token: this.#account.token,
    };

    // Get playlist name from playlists.list
    const { data } = await youtubeApi.playlists.list({
      auth: oauth2Client,
      id: [playlistId],
      part: ["snippet"],
    });
    const playlistName = data.items[0].snippet.title;
    const allItems: youtube_v3.Schema$PlaylistItem[] = [];

    const fetchPlaylistItems = async (params = {}) => {
      return new Promise<youtube_v3.Schema$PlaylistItem[]>((resolve) => {
        setTimeout(async () => {
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
            resolve(
              fetchPlaylistItems({
                pageToken: nextPageToken,
              })
            );
          }

          resolve(allItems);
        });
      });
    };

    try {
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
        type: "interstitial" as TrackType,
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
