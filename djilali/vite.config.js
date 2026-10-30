import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // relative base so the build works from any subpath (e.g. GitHub Pages)
  base: './',
  plugins: [react(), tailwindcss()],
  server: { port: 5950 },
})
