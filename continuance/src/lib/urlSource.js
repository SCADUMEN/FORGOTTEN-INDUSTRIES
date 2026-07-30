// A runtime, user-pasted URL source: the user picks "URL…" in a column and
// enters any URL, which is fetched and indexed in the browser. Because the
// fetch is client-side, it is subject to CORS - many origins block cross-origin
// reads, and those surface as load errors rather than data.
//
// The payload shape is unknown, so we normalize best-effort to the same Record
// shape every other source uses:
//   Record { id, sourceId, title, text, url?, tags[], date?, type?, summary?, meta{} }
//
// The same normalization powers two runtime sources: pasted URLs (sourceId
// '__url__', the column-select sentinel) and hardcoded feeds like nor (sourceId
// 'nor'). sourceId is stamped on every record so the anchor source-consistency
// guard in App knows which column a record belongs to.

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
  return (
    String(html)
      // Drop script/style blocks whole. The closing-tag match tolerates
      // whitespace and stray attributes (e.g. `</script >`) so content can't slip
      // through the filter (CodeQL js/bad-tag-filter).
      .replace(/<script\b[\s\S]*?<\/script[^>]*>/gi, ' ')
      .replace(/<style\b[\s\S]*?<\/style[^>]*>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z#0-9]+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  )
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

// A JSON Feed (jsonfeed.org) item -> Record.
function feedItemToRecord(item, index, base, sourceId) {
  const body =
    item.content_text || urlHtmlToText(item.content_html) || item.summary || ''
  return {
    id: String(item.id || item.url || `${base}#${index}`),
    sourceId,
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
function jsonElementToRecord(element, index, base, sourceId) {
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
        element.id ||
          element.guid ||
          element.url ||
          element.slug ||
          `${base}#${index}`
      ),
      sourceId,
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
    sourceId,
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
// then plain text / HTML as a single record. sourceId marks which source the
// records belong to (the URL sentinel for pasted URLs, or a named source id
// like 'nor' for a hardcoded runtime feed).
export function normalizeUrlPayload(url, payload, sourceId = URL_SOURCE_ID) {
  if (payload && typeof payload === 'object' && Array.isArray(payload.items)) {
    return payload.items.map((item, i) =>
      feedItemToRecord(item, i, url, sourceId)
    )
  }
  if (Array.isArray(payload)) {
    return payload.map((element, i) =>
      jsonElementToRecord(element, i, url, sourceId)
    )
  }
  if (payload && typeof payload === 'object') {
    return [jsonElementToRecord(payload, 0, url, sourceId)]
  }

  const raw = String(payload || '')
  const text = urlHtmlToText(raw)
  if (!text) return []
  return [
    {
      id: `${url}#0`,
      sourceId,
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
