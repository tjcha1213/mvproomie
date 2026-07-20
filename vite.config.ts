import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// https://vite.dev/config/
// On GitHub Pages this is served from a project subpath (/mvproomie/), so the
// build needs that base. Dev stays at '/' so the local server/preview is normal.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/mvproomie/' : '/',
  resolve: {
    alias: {
      '/src-mvp1': resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        landlordsBrokers: resolve(__dirname, 'landlords-brokers.html'),
        userSurveys: resolve(__dirname, 'user-surveys.html'),
        mvp1: resolve(__dirname, 'mvp1/index.html'),
        mvp2: resolve(__dirname, 'mvp2/index.html'),
        mvp3: resolve(__dirname, 'mvp3/index.html'),
        landlord: resolve(__dirname, 'landlord/index.html'),
      },
    },
  },
}))
