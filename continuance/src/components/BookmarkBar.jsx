import { useRef } from 'react'
import { sourceCode } from '../lib/bookmarks.js'

// Saved cross-references, as a removable chip bar under the search box. Each
// chip restores a whole configuration (both sources, URLs, query, anchored
// post); the ✕ removes it. Renders nothing when there are no bookmarks.
export default function BookmarkBar({ bookmarks, onRestore, onRemove }) {
  const openButtons = useRef(new Map())

  // Removing a chip unmounts the focused ✕ button. Move focus to the next
  // chip (or the previous one when removing the last), falling back to the
  // search box when no chips remain, so keyboard users are not dropped to the
  // top of the page.
  const handleRemove = (index, key) => {
    const neighbor = bookmarks[index + 1] ?? bookmarks[index - 1]
    const target = neighbor
      ? openButtons.current.get(neighbor.key)
      : document.getElementById('continuance-search')
    target?.focus()
    onRemove(key)
  }

  if (!bookmarks.length) return null

  return (
    <nav className="continuance-bookmarks" aria-label="Saved cross-references">
      <p className="section-label continuance-bookmarks-label">
        &gt; Bookmarks
      </p>
      <ul className="continuance-bookmarks-list">
        {bookmarks.map((bookmark, index) => {
          // The anchor's own source leads the arrow, encoding which side it was.
          const anchorIsA = bookmark.anchorSide === 'A'
          const anchorSrc = anchorIsA
            ? sourceCode(bookmark.colA, bookmark.urlA)
            : sourceCode(bookmark.colB, bookmark.urlB)
          const targetSrc = anchorIsA
            ? sourceCode(bookmark.colB, bookmark.urlB)
            : sourceCode(bookmark.colA, bookmark.urlA)
          return (
            <li key={bookmark.key} className="continuance-bookmark">
              <button
                type="button"
                className="continuance-bookmark-open"
                ref={(node) => {
                  if (node) openButtons.current.set(bookmark.key, node)
                  else openButtons.current.delete(bookmark.key)
                }}
                onClick={() => onRestore(bookmark)}
                title={`Restore: ${bookmark.anchor.title}`}
              >
                <span className="continuance-bookmark-title">
                  {bookmark.anchor.title}
                </span>
                <span className="continuance-bookmark-pair">
                  {anchorSrc} &rarr; {targetSrc}
                </span>
              </button>
              <button
                type="button"
                className="continuance-bookmark-remove"
                aria-label={`Remove bookmark: ${bookmark.anchor.title}`}
                onClick={() => handleRemove(index, bookmark.key)}
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
