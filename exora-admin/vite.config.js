import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'firebase-sw',
      enforce: 'pre',
      handleHotUpdate({ file, server }) {
        if (file.endsWith('firebase-messaging-sw.js')) {
          server.ws.send({
            type: 'full-reload',
            path: '*'
          })
        }
      }
    }
  ]
})