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
  <div v-if="state.isLoggedIn">
    <button @click="handleLogout">[Spotify] Logout</button>
  </div>
  <div v-else>
    <button @click="handleLogin">Login with Spotify</button>
  </div>
</template>
