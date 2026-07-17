// A runtime, user-pasted URL source: the user picks "URL…" in a column and
// enters any URL, which is fetched and indexed in the browser. Because the
// fetch is client-side, it is subject to CORS - many origins block cross-origin
// reads, and those surface as load errors rather than data.
//
// The payload shape is unknown, so we normalize best-effort to the same Record
// shape every other source uses:
//   Record { id, sourceId, title, text, url?, tags[], date?, type?, summary?, meta{} }
//
// sourceId is always '__url__' (the column-select sentinel) so the anchor
// source-consistency guard in App treats a URL record as belonging to the URL
// slot regardless of which URL produced it.

const URL_SOURCE_ID = '__url__'

// Route a target URL through a CORS proxy (`<proxyBase>?url=<encoded>`). An
// empty proxyBase means "fetch directly". Tolerates a proxyBase that already
// carries a query string.
export function buildProxyUrl(proxyBase, url) {
  if (!proxyBase) return url
  const separator = proxyBase.includes('?') ? '&' : '?'
  return `${proxyBase}${separator}url=${encodeURIComponent(url)}`
}

export function hostnameOf(url) {
  try {
    return new URL(url).hostname || url
  } catch {
    return url
  }
}

export function urlHtmlToText(html) {
  if (!html) return ''
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function titleFromHtml(html) {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(String(html || ''))
  return match ? urlHtmlToText(match[1]) : ''
}

function firstOf(obj, keys) {
  for (const key of keys) {
    const value = obj[key]
    if (typeof value === 'string' && value.trim()) return value
  }
  return ''
}

// A JSON Feed (jsonfeed.org) item -> Record. Mirrors the build-time indexer's
// normalizeFeedItem, minus the nor-specific bits.
function feedItemToRecord(item, index, base) {
  const body =
    item.content_text || urlHtmlToText(item.content_html) || item.summary || ''
  return {
    id: String(item.id || item.url || `${base}#${index}`),
    sourceId: URL_SOURCE_ID,
    title: item.title || String(item.id || `Item ${index + 1}`),
    text: body,
    url: item.url || item.external_url || item.id || null,
    tags: (Array.isArray(item.tags) ? item.tags : []).filter(Boolean),
    date: item.date_published || item.date_modified || null,
    type: 'feed-item',
    summary: item.summary || '',
    meta: {},
  }
}

// A generic JSON element -> Record. Objects are mapped by common field names;
// primitives become a single-line record; anything else is JSON-stringified so
// it stays searchable.
function jsonElementToRecord(element, index, base) {
  if (element && typeof element === 'object') {
    const text =
      firstOf(element, [
        'content_text',
        'content',
        'body',
        'description',
        'summary',
        'text',
      ]) || JSON.stringify(element)
    return {
      id: String(
        element.id || element.guid || element.url || element.slug || `${base}#${index}`
      ),
      sourceId: URL_SOURCE_ID,
      title:
        firstOf(element, ['title', 'name', 'headline', 'subject', 'label']) ||
        `Item ${index + 1}`,
      text,
      url: firstOf(element, ['url', 'link', 'href', 'permalink']) || null,
      tags: (Array.isArray(element.tags) ? element.tags : []).filter(Boolean),
      date:
        firstOf(element, ['date_published', 'date', 'published', 'updated']) ||
        null,
      type: 'json',
      summary: firstOf(element, ['summary', 'description']) || '',
      meta: {},
    }
  }
  return {
    id: `${base}#${index}`,
    sourceId: URL_SOURCE_ID,
    title: `Item ${index + 1}`,
    text: String(element),
    url: null,
    tags: [],
    date: null,
    type: 'json',
    summary: '',
    meta: {},
  }
}

// Normalize a fetched payload (already JSON-parsed when possible, else the raw
// string) into Records. Detection order: JSON Feed, JSON array, JSON object,
// then plain text / HTML as a single record.
export function normalizeUrlPayload(url, payload) {
  if (payload && typeof payload === 'object' && Array.isArray(payload.items)) {
    return payload.items.map((item, i) => feedItemToRecord(item, i, url))
  }
  if (Array.isArray(payload)) {
    return payload.map((element, i) => jsonElementToRecord(element, i, url))
  }
  if (payload && typeof payload === 'object') {
    return [jsonElementToRecord(payload, 0, url)]
  }

  const raw = String(payload || '')
  const text = urlHtmlToText(raw)
  if (!text) return []
  return [
    {
      id: `${url}#0`,
      sourceId: URL_SOURCE_ID,
      title: titleFromHtml(raw) || hostnameOf(url),
      text,
      url,
      tags: [],
      date: null,
      type: 'page',
      summary: '',
      meta: {},
    },
  ]
}
