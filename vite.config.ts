import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

// Two pages: the landing site at / and the app at /app/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        site: resolve(__dirname, 'index.html'),
        app: resolve(__dirname, 'app/index.html'),
      },
    },
  },
})
