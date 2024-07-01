import { JSONFilePreset } from "lowdb/node";
import { accountsDbPath } from "../consts";
import type { Account, AccountDbItem } from "Viz";

type AccountsDbType = {
  [accountId: string]: AccountDbItem;
};

const accountsDb = await JSONFilePreset<AccountsDbType>(accountsDbPath, {});
await accountsDb.read();

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

  async edit(accountId: string, props: Partial<AccountDbItem>) {
    await accountsDb.update((data) => {
      Object.assign(data[accountId] ?? {}, props);
    });
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
