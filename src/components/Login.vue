<script setup lang="ts">
import axios from 'axios'
import { removeCookie } from 'typescript-cookie'
import type { AppState } from 'Viz'
import { url } from '../consts'

const props = defineProps<{ state: AppState }>()

const handleLogin = () => {
  window.location.assign(url.authorize)
}

const handleLogout = async () => {
  await axios.get(url.api.logout)
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
