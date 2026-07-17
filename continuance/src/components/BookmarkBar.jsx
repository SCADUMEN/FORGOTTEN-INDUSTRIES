// Saved cross-references, as a removable chip bar under the search box. Each
// chip restores a whole configuration (both sources, query, anchored post);
// the ✕ removes it. Renders nothing when there are no bookmarks.
export default function BookmarkBar({ bookmarks, manifest, onRestore, onRemove }) {
  if (!bookmarks.length) return null

  // Short SYSOUT-style source code from a source id (fi -> FI). Falls back to
  // the manifest label's initials if a source id ever goes missing.
  const labelFor = (id) => {
    if (id) return String(id).toUpperCase()
    const source = manifest?.sources.find((s) => s.id === id)
    return source?.label || '?'
  }

  return (
    <nav className="continuance-bookmarks" aria-label="Saved cross-references">
      <p className="section-label continuance-bookmarks-label">
        &gt; Bookmarks
      </p>
      <ul className="continuance-bookmarks-list">
        {bookmarks.map((bookmark) => {
          // The anchor's own source leads the arrow, encoding which side it was.
          const anchorSrc =
            bookmark.anchorSide === 'A' ? bookmark.colA : bookmark.colB
          const targetSrc =
            bookmark.anchorSide === 'A' ? bookmark.colB : bookmark.colA
          return (
            <li key={bookmark.key} className="continuance-bookmark">
              <button
                type="button"
                className="continuance-bookmark-open"
                onClick={() => onRestore(bookmark)}
                title={`Restore: ${bookmark.anchor.title}`}
              >
                <span className="continuance-bookmark-title">
                  {bookmark.anchor.title}
                </span>
                <span className="continuance-bookmark-pair">
                  {labelFor(anchorSrc)} &rarr; {labelFor(targetSrc)}
                </span>
              </button>
              <button
                type="button"
                className="continuance-bookmark-remove"
                aria-label={`Remove bookmark: ${bookmark.anchor.title}`}
                onClick={() => onRemove(bookmark.key)}
              >
                &times;
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
