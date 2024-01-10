import { Account } from "Viz";
import { AccountsDb } from "../server/db/AccountsDb";
import playerApi from "../server/players";

export async function onLogout(account: Account) {
  const player = new playerApi[account.player](account.id);
  player.logout();
}

export async function onUpdateAccountsStore() {
  return Object.values(AccountsDb.accounts).map(
    ({ id, player, isLoggedIn, displayName, profileUrl }) => ({
      id,
      player,
      isLoggedIn,
      displayName,
      profileUrl,
      playlists: null,
    })
  );
}
