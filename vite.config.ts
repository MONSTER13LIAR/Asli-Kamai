import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

// Three pages: the landing site at /, the app at /app/, the developer page at /developer/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        site: resolve(import.meta.dirname, 'index.html'),
        app: resolve(import.meta.dirname, 'app/index.html'),
        developer: resolve(import.meta.dirname, 'developer/index.html'),
      },
    },
  },
})
