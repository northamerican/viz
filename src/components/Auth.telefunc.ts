import { loggedInCookie } from "../consts";
import { PrefsDb } from "../server/db/PrefsDb";

export async function onAuthorize() {
  const redirectUrl = PrefsDb.player.authorize();
  return { redirectUrl };
}

export async function onLogin({ code }: { code: string }) {
  await PrefsDb.player.getToken(code);
  // TODO use this or lose this
  return { [loggedInCookie]: true }
}

export async function onLogout() {
  await PrefsDb.player.logout();
  // TODO use this or lose this
  return { [loggedInCookie]: false }
}