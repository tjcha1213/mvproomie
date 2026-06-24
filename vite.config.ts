import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// On GitHub Pages this is served from a project subpath (/mvproomie/), so the
// build needs that base. Dev stays at '/' so the local server/preview is normal.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/mvproomie/' : '/',
}))
