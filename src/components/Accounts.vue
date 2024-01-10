<script setup lang="ts">
import { computed, onMounted } from "vue";
import { store } from "../store";
import Account from "./Account.vue";
import LogInButton from "./LogInButton.vue";
import ListItem from "./ListItem.vue";
import players from "../players";

onMounted(async () => {
  await store.updateAccountsStore();
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

<style></style>
