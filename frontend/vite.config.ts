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
    strictPort: false,
    hmr: {
      overlay: false,
      clientPort: 5173
    },
    cors: true,
    fs: {
      allow: ['.', '../..']
    }
  },
  preview: {
    port: 4173,
    host: '0.0.0.0',
    strictPort: false
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'zustand', '@xyflow/react'],
    exclude: []
  },
  css: {
    devSourcemap: false
  }
})