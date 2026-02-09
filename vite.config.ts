import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'StageFlow',
        short_name: 'StageFlow',
        description: 'ダンスイベントなどの進行管理・タイムテーブル作成アプリ',
        theme_color: '#fff5f7',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ],
        start_url: '.',
        display: 'standalone',
        background_color: '#fff5f7'
      }
    })
  ],
  // Use '/' for dev, '/StageFlow.io/' for production build
  base: '/StageFlow.io/'
})
