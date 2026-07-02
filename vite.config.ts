import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Dev-only workaround: the deployed backend has no CORS headers yet,
      // so route API calls through the Vite dev server (same-origin from the browser's
      // perspective) instead of hitting it cross-origin directly.
      '/api/v1': {
        target: 'https://task-management-backend-2-spya.onrender.com',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@/components': path.resolve(__dirname, './src/components'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/store': path.resolve(__dirname, './src/store'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/i18n': path.resolve(__dirname, './src/i18n'),
      '@/app': path.resolve(__dirname, './src/app'),
      '@': path.resolve(__dirname, './src'),
    },
  },
})
