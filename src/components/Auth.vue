<script setup lang="ts">
import { removeCookie } from "typescript-cookie";
import { loggedInCookie } from "../consts";
import { onAuthorize, onLogin, onLogout } from "./Auth.telefunc";
import { onMounted } from "vue";
import { setCookie } from "typescript-cookie";
import { store } from "../store";

const handleLogin = async () => {
  const { redirectUrl } = await onAuthorize();
  window.location.assign(redirectUrl);
};

const handleLogout = async () => {
  await onLogout();
  removeCookie(loggedInCookie);
  store.isLoggedIn = false;
};

onMounted(async () => {
  const params = new URLSearchParams(document.location.search);
  const code = params.get("code");
  if (code) {
    await onLogin({ code });
    setCookie(loggedInCookie, true);
    window.location.assign("/");
  }
});
</script>

<template>
  <div>
    <button v-if="store.isLoggedIn" @click="handleLogout">
      [Spotify] Logout
    </button>
    <button v-else @click="handleLogin">Login with Spotify</button>
  </div>
</template>
./auth.telefunc
