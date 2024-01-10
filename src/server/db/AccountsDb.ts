import { JSONFilePreset } from "lowdb/node";
import { accountsDbPath } from "../consts";
import { AccountDbItem } from "Viz";

type AccountsDbType = {
  [accountId: string]: AccountDbItem;
};

const accountsDb = await JSONFilePreset<AccountsDbType>(accountsDbPath, {});
await accountsDb.read();

export const AccountsDb = {
  get accounts() {
    return accountsDb.data;
  },

  account(accountId: string) {
    return accountsDb.data?.[accountId];
  },

  async edit(accountId: string, props: Partial<AccountDbItem>) {
    await accountsDb.update((data) => {
      data[accountId] = { ...data?.[accountId], ...props };
    });
  },

  async remove(accountId: string) {
    await accountsDb.update((data) => {
      delete data[accountId];
    });
  },
};
