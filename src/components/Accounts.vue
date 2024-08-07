<script setup lang="ts">
import Account from "./Account.vue";
import LogInButton from "./LogInButton.vue";
import ListItem from "./ListItem.vue";
import players from "../players";
import { onMounted } from "vue";
import { store } from "../store";
import { onReadToken } from "./Accounts.telefunc";
import { tokenPath } from "../consts.ts";
import type { PlayerId } from "../types/VizPlayer";

onMounted(async () => {
  store.updateAccounts();
  store.onServerEvent("accounts:write", () => store.updateAccounts());

  const readToken = document.location.pathname.includes(tokenPath());
  if (readToken) {
    // Get playerId by isolating it from pathname
    const playerId = document.location.pathname
      .replace(tokenPath(), "")
      .replaceAll("/", "") as PlayerId;
    const params = new URLSearchParams(document.location.search);
    const code = params.get("code");
    if (code) {
      try {
        await onReadToken({ playerId, code });
        window.location.assign("/");
      } catch (e) {
        console.error(e);
      }
    }
  }
});
</script>

<template>
  <div>
    <h1>Accounts</h1>
    <div v-if="store.accounts">
      <ListItem v-for="account in store.accounts" :key="account.id">
        <Account :account="account" />
      </ListItem>
    </div>
    <div>
      <div v-for="player in players" :key="player.id">
        <LogInButton :player="player" />
      </div>
    </div>
  </div>
</template>
