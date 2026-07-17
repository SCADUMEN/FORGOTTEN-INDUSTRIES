import MiniSearch from 'minisearch'
import { buildProxyUrl, hostnameOf, normalizeUrlPayload } from './urlSource.js'

// URL-source fetches route through a CORS proxy, since arbitrary origins rarely
// send Access-Control-Allow-Origin for a browser to read cross-origin. Baked in
// at build time; override with VITE_CORS_PROXY, or set it to '' to fetch
// directly (e.g. for CORS-friendly URLs or local testing).
const CORS_PROXY =
  import.meta.env.VITE_CORS_PROXY ?? 'https://cors-proxy.vaporwavemall.com/'

// Data lives beside the app under /continuance/data/, emitted by
// scripts/build_continuance_index.cjs. BASE_URL is '/continuance/' in the build
// and on the dev server, so these resolve in both.
const DATA_BASE = `${import.meta.env.BASE_URL}data/`

let manifestPromise = null

export async function loadManifest() {
  if (manifestPromise) return manifestPromise
  manifestPromise = fetch(`${DATA_BASE}sources.json`).then((res) => {
    if (!res.ok)
      throw new Error(`Failed to load sources manifest (${res.status})`)
    return res.json()
  })
  return manifestPromise
}

const sourceCache = new Map()

export async function loadSource(id) {
  if (sourceCache.has(id)) return sourceCache.get(id)
  const promise = resolveSource(id)
  sourceCache.set(id, promise)
  return promise
}

// A build-indexed source (e.g. fi) loads its emitted JSON. A runtime "feed"
// source (e.g. nor) is declared in the manifest with a feedUrl and fetched live
// through the CORS proxy, normalized in-browser exactly like a pasted URL - so
// it never depends on the build being able to reach the origin.
async function resolveSource(id) {
  const manifest = await loadManifest()
  const descriptor = manifest.sources.find((source) => source.id === id)
  if (descriptor?.kind === 'feed' && descriptor.feedUrl) {
    return loadFeedSource(descriptor)
  }
  const res = await fetch(`${DATA_BASE}${id}.json`)
  if (!res.ok) throw new Error(`Failed to load source "${id}" (${res.status})`)
  const data = await res.json()
  return { ...data, records: dedupeById(data.records || []) }
}

// Records feed a MiniSearch index keyed by id, which rejects duplicate ids, and
// React lists keyed by id. Arbitrary sources (a hand-made CSV, a submodule with
// reused slugs) can carry duplicates, so we drop repeats defensively at load
// time - keeping the first occurrence - rather than letting one bad row crash
// the whole surface.
function dedupeById(records) {
  const seen = new Set()
  const unique = []
  for (const record of records) {
    if (seen.has(record.id)) continue
    seen.add(record.id)
    unique.push(record)
  }
  return unique
}

// Fetch a URL through the CORS proxy and normalize its payload to Records. A
// failed fetch (proxy down, target error) rejects here; the caller surfaces it
// as a column error.
async function fetchAndNormalize(url, sourceId) {
  const res = await fetch(buildProxyUrl(CORS_PROXY, url))
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const raw = await res.text()
  let payload
  try {
    payload = JSON.parse(raw)
  } catch {
    payload = raw
  }
  return dedupeById(normalizeUrlPayload(url, payload, sourceId))
}

// A pasted-URL source. The source id is unique per URL (`url:<url>`) so the
// MiniSearch index never goes stale when the URL changes; records carry the
// '__url__' sentinel sourceId.
export async function loadUrlSource(url) {
  const records = await fetchAndNormalize(url, '__url__')
  return { id: `url:${url}`, label: hostnameOf(url), kind: 'url', records }
}

// A hardcoded runtime feed source (e.g. nor). Fetched live through the proxy so
// it never depends on the build reaching the origin; records carry the source's
// own id as their sourceId.
export async function loadFeedSource({ id, label, feedUrl }) {
  const records = await fetchAndNormalize(feedUrl, id)
  return { id, label, kind: 'feed', records }
}

// One MiniSearch index per source, built once and reused. Title and tags are
// boosted so a name match outranks an incidental body match.
const indexCache = new Map()

export function buildIndex(source) {
  if (indexCache.has(source.id)) return indexCache.get(source.id)

  const mini = new MiniSearch({
    idField: 'id',
    fields: ['title', 'text', 'summary', 'tags'],
    searchOptions: {
      boost: { title: 3, tags: 2 },
      prefix: true,
      fuzzy: 0.2,
      combineWith: 'AND',
    },
    // Flatten the tags array so its terms are indexed; other fields pass
    // through. We don't storeFields - results are mapped back to the original
    // records below, so every result keeps its real shape (tags stay an array,
    // full body text stays available) instead of MiniSearch's flattened copy.
    extractField: (doc, field) =>
      field === 'tags' ? (doc.tags || []).join(' ') : doc[field] || '',
  })

  mini.addAll(source.records)
  indexCache.set(source.id, mini)
  return mini
}

// id -> original record, cached per source, so search hits map back to the
// records the UI renders.
const recordMapCache = new Map()

function recordMap(source) {
  if (recordMapCache.has(source.id)) return recordMapCache.get(source.id)
  const map = new Map(source.records.map((record) => [record.id, record]))
  recordMapCache.set(source.id, map)
  return map
}

export function search(source, query) {
  const trimmed = (query || '').trim()
  if (!trimmed) return source.records
  const index = buildIndex(source)
  const byId = recordMap(source)
  return index
    .search(trimmed)
    .map((hit) => byId.get(hit.id))
    .filter(Boolean)
}

// Look a record up by id within a loaded source.
export function recordById(source, id) {
  return recordMap(source).get(id) || null
}
