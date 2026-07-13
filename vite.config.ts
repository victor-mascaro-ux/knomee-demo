import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// The site is served statically by GitHub Pages straight from the branch —
// there is no build step on GitHub's side. So only the React prototype is
// bundled here (relative base for the /knomee-demo/ project subpath) and it is
// emitted, pre-built, into `app/`. The commenting overlay at the repo root
// (index.html) is a hand-maintained static file that iframes `./app/app.html`.
// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'app',
    emptyOutDir: true,
    rollupOptions: {
      input: { app: resolve(__dirname, 'app.html') },
    },
  },
})
