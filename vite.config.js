import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Replace '/wechat/' with your actual GitHub repository name
  base: '/wechat/',
})
