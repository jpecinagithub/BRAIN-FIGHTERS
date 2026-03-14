import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg', 'pwa/apple-touch-icon.png'],
      manifest: {
        name: 'Brain Fighters',
        short_name: 'BrainFighters',
        description: 'Entrenamiento cognitivo con minijuegos competitivos.',
        start_url: '/',
        display: 'standalone',
        theme_color: '#7dffb0',
        background_color: '#0b0f0c',
        icons: [
          {
            src: '/pwa/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/pwa/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
})
