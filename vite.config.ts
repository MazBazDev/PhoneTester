import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/app-icon.svg', 'icons/app-icon-maskable.svg'],
      manifest: {
        name: 'PhoneTester',
        short_name: 'PhoneTester',
        description: 'Diagnostic de telephone avant achat entre particuliers.',
        theme_color: '#0f172a',
        background_color: '#e2e8f0',
        display: 'standalone',
        start_url: '/#/',
        scope: '/',
        lang: 'fr',
        icons: [
          {
            src: '/icons/app-icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/icons/app-icon-maskable.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}']
      }
    })
  ],
  test: {
    environment: 'jsdom',
    globals: true
  }
})
