import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// The Ground Survey game ships under /bull-valley/ on forgotten-industries.net;
// Eleventy passthrough-copies this dist/ there. base must match so asset URLs
// resolve. Same shape as continuance/vite.config.js (CxR).

const SITE_ASSETS = fileURLToPath(new URL('../src/assets', import.meta.url))

const MIME = {
  '.json': 'application/json',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
}

// In production the game reads the same same-origin /assets/... files Eleventy
// publishes — the Scaduscope's terrain + geo data (scripts/fetch_bull_valley.cjs)
// and the self-hosted fonts. The dev server's root is this folder, so serve
// ../src/assets at that URL here; nothing is duplicated into public/.
function serveSiteAssets() {
  return {
    name: 'gs-serve-site-assets',
    configureServer(server) {
      server.middlewares.use('/assets', (req, res, next) => {
        const clean = path.normalize(
          decodeURIComponent((req.url || '').split('?')[0])
        )
        const file = path.join(SITE_ASSETS, clean)
        if (!file.startsWith(SITE_ASSETS + path.sep)) return next()
        if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return next()
        res.setHeader(
          'Content-Type',
          MIME[path.extname(file)] || 'application/octet-stream'
        )
        fs.createReadStream(file).pipe(res)
      })
    },
  }
}

export default defineConfig({
  base: '/bull-valley/',
  plugins: [serveSiteAssets()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Stable, unhashed asset names so the Eleventy page (src/bull-valley.njk)
    // can reference the bundle directly; cache-busting comes from the site's
    // ?v=assetVersion query, matching CxR and archive.css.
    rollupOptions: {
      output: {
        entryFileNames: 'assets/gs.js',
        chunkFileNames: 'assets/gs-[name].js',
        assetFileNames: 'assets/gs.[ext]',
      },
    },
  },
  server: {
    port: 5174,
  },
})
