import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// Project Pages URL: https://fabianbarua.github.io/react-reel-roulette/
export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/react-reel-roulette/' : '/',
  build: {
    outDir: 'docs-dist',
  },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
})
