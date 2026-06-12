import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Library build: ESM only, React externalized, no Tailwind processing
// (classes ship as strings; the consumer's Tailwind scans them).
export default defineConfig({
  plugins: [react()],
  publicDir: false,
  build: {
    outDir: 'dist',
    lib: {
      entry: resolve(__dirname, 'src/lib/index.ts'),
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      // CSS kept external so `import './styles.css'` survives in dist/index.js;
      // the actual file is compiled separately with the Tailwind CLI.
      external: ['react', 'react-dom', 'react/jsx-runtime', './styles.css'],
    },
  },
})
