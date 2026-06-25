import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// https://vite.dev/config/
// On GitHub Pages this is served from a project subpath (/mvproomie/), so the
// build needs that base. Dev stays at '/' so the local server/preview is normal.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/mvproomie/' : '/',
  build: {
    rollupOptions: {
      input: {
        mvp1: resolve(__dirname, 'mvp1/index.html'),
      },
    },
  },
}))
