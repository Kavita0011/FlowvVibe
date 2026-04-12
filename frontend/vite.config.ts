import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'flow-vendor': ['@xyflow/react'],
          'store-vendor': ['zustand'],
        },
      },
    },
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
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || 'https://amkstseqvrazqlxqahjx.supabase.co'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wcHN5eHFsaWhtZHNicndseWd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NDY1OTAsImV4cCI6MjA5MTUyMjU5MH0.i397B6vTmMsuOZ0ZOr-DzoTuTqmuFJjenJn4txBEiTQ'),
  },
})
