import { telefunc } from 'telefunc/vite'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// const port = 1989

export default defineConfig({
  plugins: [vue(),
  telefunc({
    disableNamingConvention: true
  })
  ],
})
