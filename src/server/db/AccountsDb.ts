import { accountsDbName } from "../consts";
import type { Account, AccountDbItem } from "Viz";
import { VizEventPreset } from "./adapters/VizEventAdapter";

type AccountsDbType = {
  [accountId: string]: AccountDbItem;
};

const accountsDb = await VizEventPreset<AccountsDbType>(accountsDbName, {});

export const AccountsDb = {
  get accounts() {
    return accountsDb.data;
  },

  get accountsAsArray(): Account[] {
    return Object.values(this.accounts).map(
      ({ id, displayName, player, isLoggedIn, profileUrl }) => ({
        id,
        displayName,
        player,
        isLoggedIn,
        profileUrl,
        playlists: null,
      })
    );
  },

  account(accountId: string) {
    return accountsDb.data?.[accountId];
  },

  async add(accountId: string, props: AccountDbItem) {
    await accountsDb.update((data) => {
      data[accountId] = props;
    });

    return this.accounts[accountId];
  },

  async logout(accountId: string) {
    await accountsDb.update((data) => {
      data[accountId].isLoggedIn = false;
      delete data[accountId].token;
      delete data[accountId].refreshToken;
    });
  },

  async remove(accountId: string) {
    await accountsDb.update((data) => {
      delete data[accountId];
    });
  },
};
