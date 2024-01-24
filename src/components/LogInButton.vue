<script setup lang="ts">
import { PlayerId } from "../types/VizPlayer";
import { onAuthorize, onLogin } from "./LogInButton.telefunc";
import { onMounted } from "vue";

const props = defineProps<{
  player: { id: PlayerId; name: string };
}>();

const handleLogin = async () => {
  const redirectUrl = await onAuthorize(props.player.id);
  window.location.assign(redirectUrl);
};

onMounted(async () => {
  // TODO dynamic w logic for youtube, others
  // Move this to accounts?
  if (props.player.id === "spotify") {
    const params = new URLSearchParams(document.location.search);
    const code = params.get("code");
    if (code) {
      await onLogin({ playerId: props.player.id, code });
      window.location.assign("/");
    }
  }
});
</script>

<template>
  <div>
    <button @click="handleLogin">Login with {{ props.player.name }}</button>
  </div>
</template>
