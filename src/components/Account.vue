<script setup lang="ts">
import { store } from "../store";
import { onLogout } from "./Account.telefunc";
import { Account } from "Viz";

const props = defineProps<{ account: Account }>();

const setAccount = (account: Account) => {
  store.view.account = account;
};

const handleLogout = async () => {
  onLogout(props.account);
};
</script>

<template>
  <a href="" @click.prevent="() => setAccount(account)">
    {{ account.player }} - {{ account.displayName }}
  </a>
  <div class="actions">
    <button v-if="props.account.isLoggedIn" @click="handleLogout">
      Logout
    </button>
  </div>
</template>
