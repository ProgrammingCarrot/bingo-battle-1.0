import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: '/bingo-battle-1.0/', // GitHub Pages 專屬 Base 路徑
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
