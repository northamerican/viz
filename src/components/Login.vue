<script setup lang="ts">
import axios from 'axios'
import { removeCookie } from 'typescript-cookie'
import type { AppState } from 'Viz'

const props = defineProps<{ state: AppState }>()

const handleLogin = () => {
  window.location.assign('/authorize')
}

const handleLogout = async () => {
  await axios.get('/logout')
  removeCookie('isLoggedIn')
  props.state.isLoggedIn = false
}
</script>

<template>
  <div>
    <button v-if="state.isLoggedIn" @click="handleLogout">
      [Spotify] Logout
    </button>
    <button v-else @click="handleLogin">Login with Spotify</button>
  </div>
</template>
