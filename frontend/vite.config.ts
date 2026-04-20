import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

const apiBaseUrl = process.env.VITE_API_BASE_URL || '/api'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: apiBaseUrl === '/api' ? {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    } : undefined,
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) return 'vendor-charts'
            if (id.includes('leaflet') || id.includes('react-leaflet')) return 'vendor-map'
            if (id.includes('lucide')) return 'vendor-icons'
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) return 'vendor-react'
          }
        },
      },
    },
  },
})