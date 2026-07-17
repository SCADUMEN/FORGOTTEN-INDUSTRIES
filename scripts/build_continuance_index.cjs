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
// v1 sources:
//   fi  - Forgotten Industries' own content, from the already-built
//         dist/search-index.json documents array.
//   nor - nor.the-rn.info, consumed from its published JSON Feed
//         (https://nor.the-rn.info/feed.json). nor is the user's own site with
//         its own build, so it publishes a standard, consumer-agnostic feed
//         rather than being vendored as a submodule - this stays current on
//         every nor deploy, needs no cross-repo auth, and is symmetric with the
//         fi source (both ingest a published JSON artifact). Degrades to an
//         empty source when the feed is unreachable, so the site still builds.
//         Override the location with CONTINUANCE_NOR_FEED (http(s) URL or a
//         local file path) - used by tests and local dev.

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const SEARCH_INDEX = path.join(ROOT, 'dist', 'search-index.json')
// nor serves under a /rm_ation/ path prefix (a bare /feed.json 301-redirects
// here); target the canonical URL directly to skip the redirect hop.
const NOR_FEED =
  process.env.CONTINUANCE_NOR_FEED || 'https://nor.the-rn.info/rm_ation/feed.json'
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
async function loadFeed(location) {
  if (/^https?:\/\//.test(location)) {
    const res = await fetch(location)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  }
  if (!fs.existsSync(location)) throw new Error(`no feed at ${location}`)
  return JSON.parse(fs.readFileSync(location, 'utf8'))
}

async function buildNorRecords() {
  let feed
  try {
    feed = await loadFeed(NOR_FEED)
  } catch (err) {
    log(`nor feed unavailable (${err.message}) - emitting empty nor source`)
    return []
  }
  const items = Array.isArray(feed.items) ? feed.items : []
  return items.map(normalizeFeedItem)
}

// Pure mapping from a JSON Feed (jsonfeed.org/version/1.1) item to a Record.
// content_html/content_text carries the body; we index plain text.
function normalizeFeedItem(item) {
  const body = item.content_text || htmlToText(item.content_html) || item.summary || ''
  return {
    id: String(item.id),
    sourceId: 'nor',
    title: item.title || String(item.id),
    text: body,
    url: item.url || item.external_url || item.id || null,
    tags: (Array.isArray(item.tags) ? item.tags : []).filter(Boolean),
    date: item.date_published || null,
    // JSON Feed has no "type"; allow a producer to hint one via the spec's
    // `_`-prefixed extension convention, else treat feed entries as posts.
    type: (item._nor && item._nor.type) || 'post',
    summary: item.summary || '',
    meta: {},
  }
}

function htmlToText(html) {
  if (!html) return ''
  return String(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Dev fidelity: copy the compiled stylesheet so `/css/archive.css` resolves on
// the Vite dev server exactly as it does on the built site. No-op in the
// production build chain, where the real site serves /css/archive.css itself.
function copyCompiledCss() {
  if (!fs.existsSync(COMPILED_CSS)) return
  ensureDir(path.dirname(CSS_DEST))
  fs.copyFileSync(COMPILED_CSS, CSS_DEST)
  log('copied compiled archive.css into continuance/public/css for dev')
}

async function main() {
  ensureDir(OUT_DIR)

  const sources = [
    { id: 'fi', label: 'Forgotten Industries', kind: 'fi', records: buildFiRecords() },
    { id: 'nor', label: 'nor.the-rn.info', kind: 'feed', records: await buildNorRecords() },
  ]

  const manifest = { generatedAt: new Date().toISOString(), sources: [] }

  for (const source of sources) {
    const descriptor = {
      id: source.id,
      label: source.label,
      kind: source.kind,
      recordCount: source.records.length,
    }
    writeJSON(path.join(OUT_DIR, `${source.id}.json`), {
      ...descriptor,
      records: source.records,
    })
    manifest.sources.push(descriptor)
    log(`${source.id}: ${source.records.length} records`)
  }

  writeJSON(path.join(OUT_DIR, 'sources.json'), manifest)
  copyCompiledCss()
  log('done')
}

if (require.main === module) {
  main().catch((err) => {
    process.stderr.write(`[continuance:index] fatal: ${err.stack || err}\n`)
    process.exit(1)
  })
}

module.exports = {
  normalizeFiDocuments,
  normalizeFeedItem,
  htmlToText,
}
