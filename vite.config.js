import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('three') || id.includes('@react-three')) return 'three-scene'
          if (id.includes('gsap')) return 'motion'
          if (id.includes('react')) return 'react-vendor'
        },
      },
    },
  },
})
