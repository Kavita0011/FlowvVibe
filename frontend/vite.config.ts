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
    minify: 'terser',
    sourcemap: false,
    ssr: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-flow': ['@xyflow/react'],
          'vendor-state': ['zustand'],
          'vendor-ui': ['lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
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
  define: {},
})
