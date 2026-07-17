// Bookmarks persist a whole cross-reference configuration, not a single record:
// the anchored post, the two sources being cross-referenced (and which column
// held the anchor), and the query that was active. Restoring a bookmark
// reselects both sources, refills the query, and re-anchors the post, so the
// exact cross-reference reappears.
//
// A bookmark's identity is the (colA, colB, anchorSide, anchor id) tuple - NOT
// the query. Re-saving the same triple with a different query updates the
// existing entry rather than spawning a near-duplicate chip.

// Stable identity string for a cross-reference configuration.
export function bookmarkKey({ colA, colB, anchorSide, anchorId }) {
  return `${colA}|${colB}|${anchorSide}|${anchorId}`
}

// Build a Bookmark from the current app state. `record` is stored whole (not by
// id) so the chip renders and the cross-reference re-scores without the anchor's
// source being loaded, and so restore survives the source data changing between
// deploys. `now` is injected (Date.now()) so this stays a pure function.
export function makeBookmark({ colA, colB, query, anchorSide, record }, now) {
  return {
    key: bookmarkKey({ colA, colB, anchorSide, anchorId: record.id }),
    savedAt: now,
    colA,
    colB,
    query: query || '',
    anchorSide,
    anchor: record,
  }
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
