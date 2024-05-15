<script setup lang="ts">
import { PlayerId } from "../types/VizPlayer";
import { onAuthorize } from "./LogInButton.telefunc";

const props = defineProps<{
  player: { id: PlayerId; name: string };
}>();

const handleLogin = async () => {
  const redirectUri = await onAuthorize(props.player.id);
  window.location.assign(redirectUri);
};
</script>

<template>
  <div>
    <button @click="handleLogin">Login with {{ props.player.name }}</button>
  </div>
</template>
