<script setup lang="ts">
import { store } from "../store";
import { onAuthorize, onLogout, onRemove } from "./Account.telefunc";
import type { Account } from "Viz";
import ActionsMenu from "./ActionsMenu.vue";

const props = defineProps<{ account: Account }>();

const setAccount = (account: Account) => {
  store.view.account = account;
};

const handleLogin = async () => {
  const redirectUri = await onAuthorize(props.account.player);
  window.location.assign(redirectUri);
};

const handleLogout = async () => {
  await onLogout(props.account);
};

const handleRemove = async () => {
  await onRemove(props.account);
};

const openProfile = () => {
  window.open(props.account.profileUrl);
};

const actionsMenuOptions = () => [
  props.account.isLoggedIn
    ? { action: handleLogout, label: "Log out" }
    : { action: handleLogin, label: "Log in" },
  { action: handleRemove, label: "Remove" },
  { action: openProfile, label: "Go to Profile..." },
];
</script>

<template>
  <a
    href=""
    @click.prevent="() => setAccount(account)"
    :class="{ 'logged-out': !account.isLoggedIn }"
  >
    {{ account.player }} - {{ account.displayName }}
  </a>
  <div class="actions">
    <ActionsMenu :options="actionsMenuOptions()" />
  </div>
</template>

<style scoped>
.logged-out {
  pointer-events: none;
  cursor: default;
  color: #999;
}
</style>
