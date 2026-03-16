import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'date-fns': ['date-fns'],
          'zustand': ['zustand'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/sd-api': {
        target: 'http://127.0.0.1:7860',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sd-api/, ''),
      },
      '/kokoro-api': {
        target: 'http://127.0.0.1:8880',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/kokoro-api/, ''),
      },
    },
  },
})
