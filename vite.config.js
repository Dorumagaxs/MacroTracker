import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  base: '/MacroTracker/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate', // Atualiza o SW automaticamente quando houver novas versões
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Macro Tracker',
        short_name: 'MacroTracker',
        description: 'Seu rastreador de macros',
        display: "standalone",
        theme_color: "#386a20",
        background_color: "#386a20",
        start_url: '/MacroTracker/',
        scope: '/MacroTracker/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      }
    }),
    {
      name: 'force-manifest-json-copy',
      closeBundle() {
        const distDir = path.resolve(__dirname, 'dist')
        const webmanifestPath = path.join(distDir, 'manifest.webmanifest')
        const jsonPath = path.join(distDir, 'manifest.json')
        
        if (fs.existsSync(webmanifestPath)) {
          fs.copyFileSync(webmanifestPath, jsonPath)
        }
      }
    }
  ]
})