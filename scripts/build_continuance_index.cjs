#!/usr/bin/env node
'use strict'

// Builds the normalized data indexes CONTINUANCE loads at runtime.
//
// Every source, whatever its origin, is reduced to the same Record shape so the
// two-column research UI can treat them interchangeably and new source types can
// be added later without touching the app:
//
//   Record { id, sourceId, title, text, url?, tags[], date?, type?, summary?, meta{} }
//
// Sources:
//   fi  - Forgotten Industries' own content, from the already-built
//         dist/search-index.json documents array. Indexed here into fi.json.
//   nor - nor.the-rn.info's published JSON Feed. NOT fetched at build time: the
//         feed sits behind Cloudflare bot protection that 403s datacenter IPs
//         (GitHub Actions), so a build fetch is unreliable. Instead we emit only
//         a "feed" descriptor (id + label + feedUrl) into the manifest, and the
//         app fetches + normalizes it live in the browser through the CORS proxy
//         (continuance/src/lib/sources.js). Override the URL with
//         CONTINUANCE_NOR_FEED.

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const SEARCH_INDEX = path.join(ROOT, 'dist', 'search-index.json')
// nor serves under a /rm_ation/ path prefix (a bare /feed.json 301-redirects
// here); target the canonical URL directly to skip the redirect hop.
const NOR_FEED =
  process.env.CONTINUANCE_NOR_FEED ||
  'https://nor.the-rn.info/rm_ation/feed.json'
const OUT_DIR = path.join(ROOT, 'continuance', 'public', 'data')
const COMPILED_CSS = path.join(ROOT, '_site', 'css', 'archive.css')
const CSS_DEST = path.join(ROOT, 'continuance', 'public', 'css', 'archive.css')

function log(message) {
  process.stdout.write(`[continuance:index] ${message}\n`)
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function writeJSON(file, value) {
  ensureDir(path.dirname(file))
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
}

// --- FI source -------------------------------------------------------------
// The Ruby build already flattens every archive record into a search document
// with title/body/tags/url, so we map documents 1:1 rather than re-deriving.
function buildFiRecords() {
  if (!fs.existsSync(SEARCH_INDEX)) {
    log(
      `dist/search-index.json missing - run \`ruby scripts/build.rb\` first. Emitting empty FI source.`
    )
    return []
  }

  const index = JSON.parse(fs.readFileSync(SEARCH_INDEX, 'utf8'))
  const documents = Array.isArray(index.documents) ? index.documents : []
  return normalizeFiDocuments(documents)
}

// Pure mapping from search-index documents to Records, split out so it can be
// unit-tested without touching the filesystem.
//
// The search-index `id` is only unique within a document type (e.g. a voice log
// and a social post can both be "002"), but the search engine and React keys
// need globally unique ids. Compose `type:id`, and fall back to a numeric
// suffix if even that repeats, so the index can never throw on a duplicate.
function normalizeFiDocuments(documents) {
  const seen = new Map()
  return documents.map((doc) => {
    const base = `${doc.type || 'doc'}:${doc.id}`
    const count = seen.get(base) || 0
    seen.set(base, count + 1)
    const id = count === 0 ? base : `${base}#${count}`

    return {
      id,
      sourceId: 'fi',
      title: doc.title || doc.object || String(doc.id),
      text: doc.body || doc.summary || '',
      url: doc.url || null,
      tags: Array.isArray(doc.tags) ? doc.tags : [],
      date: doc.date || null,
      type: doc.type || null,
      summary: doc.summary || '',
      meta: {
        recordId: String(doc.id),
        category: doc.category || null,
        system: doc.system || null,
        status: doc.status || null,
        source: doc.source || null,
      },
    }
  })
}

// --- nor source ------------------------------------------------------------
// nor is NOT indexed at build time. Its feed lives behind Cloudflare bot
// protection that 403s datacenter IPs (GitHub Actions), so a build-time fetch
// is unreliable. Instead nor is declared as a runtime "feed" source in the
// manifest and fetched live in the browser through the CORS proxy - the same
// path a pasted URL takes (continuance/src/lib/sources.js loadFeedSource).

// Dev fidelity: copy the compiled stylesheet so `/css/archive.css` resolves on
// the Vite dev server exactly as it does on the built site. No-op in the
// production build chain, where the real site serves /css/archive.css itself.
function copyCompiledCss() {
  if (!fs.existsSync(COMPILED_CSS)) return
  ensureDir(path.dirname(CSS_DEST))
  fs.copyFileSync(COMPILED_CSS, CSS_DEST)
  log('copied compiled archive.css into continuance/public/css for dev')
}

function main() {
  ensureDir(OUT_DIR)

  const manifest = { generatedAt: new Date().toISOString(), sources: [] }

  // FI content is local and indexed at build time into its own JSON file.
  const fiRecords = buildFiRecords()
  const fiDescriptor = {
    id: 'fi',
    label: 'Forgotten Industries',
    kind: 'fi',
    recordCount: fiRecords.length,
  }
  writeJSON(path.join(OUT_DIR, 'fi.json'), {
    ...fiDescriptor,
    records: fiRecords,
  })
  manifest.sources.push(fiDescriptor)
  log(`fi: ${fiRecords.length} records`)

  // nor is a runtime feed - no records emitted here, just the descriptor the
  // app uses to fetch and index it live through the CORS proxy.
  manifest.sources.push({
    id: 'nor',
    label: 'nor.the-rn.info',
    kind: 'feed',
    feedUrl: NOR_FEED,
  })
  log(`nor: runtime feed (${NOR_FEED})`)

  writeJSON(path.join(OUT_DIR, 'sources.json'), manifest)
  copyCompiledCss()
  log('done')
}

if (require.main === module) {
  try {
    main()
  } catch (err) {
    process.stderr.write(`[continuance:index] fatal: ${err.stack || err}\n`)
    process.exit(1)
  }
}

module.exports = {
  normalizeFiDocuments,
}
