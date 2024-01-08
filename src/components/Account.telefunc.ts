import { Account } from "Viz";
import { AccountsDb } from "../server/db/AccountsDb";
import players from "../server/players";

export async function onLogout(account: Account) {
  const player = new players[account.player].api(account.id);
  player.logout();
}

export async function onUpdateAccountsStore() {
  return Object.values(AccountsDb.accounts).map(
    ({ id, player, isLoggedIn, displayName }) => ({
      id,
      player,
      isLoggedIn,
      displayName,
      playlists: null,
    })
  );
}
