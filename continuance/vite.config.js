import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The app (CxR) ships under /cxr/ on forgotten-industries.net; Eleventy
// passthrough-copies this dist/ there. base must match so asset URLs resolve.
export default defineConfig({
  base: '/cxr/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Stable, unhashed asset names so the Eleventy page (src/cxr.njk) can
    // reference the bundle directly; cache-busting comes from the site's
    // ?v=assetVersion query, matching how base.njk links archive.css.
    rollupOptions: {
      output: {
        entryFileNames: 'assets/cxr.js',
        chunkFileNames: 'assets/cxr-[name].js',
        assetFileNames: 'assets/cxr.[ext]',
      },
    },
  },
  server: {
    port: 5173,
  },
})
