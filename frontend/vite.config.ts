import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  define: {
    'process.env': {},
  },
  plugins: [react(), cloudflare()],
  base: './', // Added this line
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    chunkSizeWarningLimit: 500,
  },
  esbuild: {
    platform: 'browser',
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    cors: true,
  },
  preview: {
    port: 4173,
    host: '0.0.0.0',
  },
})