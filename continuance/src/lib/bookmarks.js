import { URL_SOURCE_ID, hostnameOf } from './urlSource.js'

// Bookmarks persist a whole cross-reference configuration, not a single record:
// the anchored post, the two sources being cross-referenced (and which column
// held the anchor), the URL behind any URL column, and the query that was
// active. Restoring a bookmark reselects both sources (and URLs), refills the
// query, and re-anchors the post, so the exact cross-reference reappears.
//
// A bookmark's identity is the (colA, colB, anchorSide, anchor id) tuple - NOT
// the query. A URL column contributes its URL to the identity, since two
// different pasted URLs are two different sources. Re-saving the same tuple
// with a different query updates the existing entry rather than spawning a
// near-duplicate chip.

// A column's contribution to the key: its source id, or `__url__:<url>` for a
// URL column. Non-URL keys are unchanged from before URLs were tracked, so
// bookmarks saved earlier keep matching.
function columnKey(col, url) {
  return col === URL_SOURCE_ID ? `${col}:${url || ''}` : col
}

// Stable identity string for a cross-reference configuration.
export function bookmarkKey({ colA, colB, urlA, urlB, anchorSide, anchorId }) {
  return `${columnKey(colA, urlA)}|${columnKey(colB, urlB)}|${anchorSide}|${anchorId}`
}

// Build a Bookmark from the current app state. `record` is stored whole (not by
// id) so the chip renders and the cross-reference re-scores without the anchor's
// source being loaded, and so restore survives the source data changing between
// deploys. URLs are stored only for URL columns. `now` is injected (Date.now())
// so this stays a pure function.
export function makeBookmark(
  { colA, colB, urlA, urlB, query, anchorSide, record },
  now
) {
  const bookmark = {
    key: bookmarkKey({
      colA,
      colB,
      urlA,
      urlB,
      anchorSide,
      anchorId: record.id,
    }),
    savedAt: now,
    colA,
    colB,
    query: query || '',
    anchorSide,
    anchor: record,
  }
  if (colA === URL_SOURCE_ID) bookmark.urlA = urlA || ''
  if (colB === URL_SOURCE_ID) bookmark.urlB = urlB || ''
  return bookmark
}

// Bookmarks come back from localStorage, so anything malformed (hand edits, an
// older shape) is dropped rather than crashing the chip bar.
export function isValidBookmark(bookmark) {
  return Boolean(
    bookmark &&
    typeof bookmark.key === 'string' &&
    (bookmark.anchorSide === 'A' || bookmark.anchorSide === 'B') &&
    bookmark.anchor &&
    typeof bookmark.anchor.id === 'string'
  )
}

// Insert `bookmark`, newest first. If its key already exists, replace it in
// place-at-front (refreshing query + savedAt) rather than duplicating.
export function upsertBookmark(list, bookmark) {
  const rest = list.filter((b) => b.key !== bookmark.key)
  return [bookmark, ...rest]
}

// Save toggle: remove the entry if the same configuration is already saved,
// otherwise add it (via upsert, so the stored query is always current).
export function toggleBookmark(list, bookmark) {
  if (list.some((b) => b.key === bookmark.key)) {
    return list.filter((b) => b.key !== bookmark.key)
  }
  return upsertBookmark(list, bookmark)
}

export function isBookmarked(list, key) {
  return key != null && list.some((b) => b.key === key)
}

// Short SYSOUT-style source code for a bookmark chip (fi -> FI). A URL column
// shows the pasted URL's host (or just URL when none was stored).
export function sourceCode(id, url) {
  if (id === URL_SOURCE_ID) return url ? hostnameOf(url) : 'URL'
  return id ? String(id).toUpperCase() : '?'
}
