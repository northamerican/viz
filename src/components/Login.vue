<script setup lang="ts">
import { onMounted } from 'vue'
import type { AppState } from '../types/viz'
import { getCookie, removeCookie } from 'typescript-cookie'

const { state } = defineProps<{ state: AppState }>()

const getToken = () => {
  state.token = getCookie('token')
}

const handleLogin = () => {
  window.location.assign('/authorize')
}

const handleLogout = async () => {
  removeCookie('token')
  state.token = null
}

onMounted(async () => {
  getToken()
})
</script>

<template>
  <div v-if="state.token">
    <button @click="handleLogout">[Spotify] Logout</button>
  </div>
  <div v-else>
    <button @click="handleLogin">Login with Spotify</button>
  </div>
</template>
