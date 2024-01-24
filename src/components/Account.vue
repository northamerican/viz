<script setup lang="ts">
import { store } from "../store";
import { onLogout, onRemove } from "./Account.telefunc";
import { Account } from "Viz";
import ActionsMenu from "./ActionsMenu.vue";

const props = defineProps<{ account: Account }>();

const setAccount = (account: Account) => {
  store.view.account = account;
};

const handleLogin = () => {};

const handleLogout = async () => {
  await onLogout(props.account);
  store.updateAccountsStore();
};

const handleRemove = async () => {
  await onRemove(props.account);
  store.updateAccountsStore();
};

const openProfile = () => {
  console.log(props.account.profileUrl);
  window.open(props.account.profileUrl);
};

const actionsMenuOptions = () => [
  props.account.isLoggedIn
    ? { action: handleLogout, label: "Log out" }
    : { action: handleLogin, label: "Log in", disabled: true },
  { action: handleRemove, label: "Remove" },
  { action: openProfile, label: "Open Profile..." },
];
</script>

<template>
  <a href="" @click.prevent="() => setAccount(account)">
    <!-- :disabled="!account.isLoggedIn" -->
    {{ account.player }} - {{ account.displayName }}
  </a>
  <div class="actions">
    <ActionsMenu :options="actionsMenuOptions()" />
  </div>
</template>
