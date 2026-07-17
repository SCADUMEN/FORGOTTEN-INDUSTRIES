// The cross-reference panel. Given the anchor record selected in one column,
// it lists the records in the OTHER column that share the most meaning, and
// shows the terms and tags each match was made on so the link is legible.
export default function CrossReference({
  anchor,
  anchorSide,
  targetLabel,
  related,
  onOpen,
  onBookmark,
  isSaved,
}) {
  if (!anchor) {
    return (
      <aside className="continuance-crossref is-empty" aria-live="polite">
        <p className="section-label">&gt; Cross-Reference</p>
        <p className="continuance-crossref-hint">
          Select a record in either column to surface related records from the
          other source.
        </p>
      </aside>
    )
  }

  return (
    <aside className="continuance-crossref" aria-live="polite">
      <div className="continuance-crossref-head">
        <p className="section-label">&gt; Cross-Reference</p>
        <button
          type="button"
          className="continuance-bookmark-save"
          aria-pressed={isSaved}
          onClick={onBookmark}
        >
          {isSaved ? 'Saved' : 'Bookmark'}
        </button>
      </div>
      <p className="continuance-crossref-anchor">
        <span className="continuance-crossref-anchor-label">
          {anchorSide} anchor
        </span>
        <span className="continuance-crossref-anchor-title">
          {anchor.title}
        </span>
      </p>
      <p className="fi-caption-box">
        <span className="fi-prompt-marker">&gt;</span> RELATED IN {targetLabel}{' '}
        ({related.length})
      </p>

      <ol className="continuance-crossref-list">
        {related.map(({ record, sharedTerms, sharedTags, score }) => (
          <li key={record.id}>
            <button
              type="button"
              className="continuance-crossref-item"
              onClick={() => onOpen(record)}
            >
              <span className="continuance-result-title">{record.title}</span>
              <span className="continuance-crossref-score">score {score}</span>
              {sharedTags.length ? (
                <span className="continuance-tags">
                  {sharedTags.map((tag) => (
                    <span key={tag} className="continuance-tag is-shared">
                      {tag}
                    </span>
                  ))}
                </span>
              ) : null}
              {sharedTerms.length ? (
                <span className="continuance-crossref-terms">
                  {sharedTerms.join(' · ')}
                </span>
              ) : null}
            </button>
          </li>
        ))}
        {related.length === 0 ? (
          <li className="continuance-empty">
            No shared terms with {targetLabel}.
          </li>
        ) : null}
      </ol>
    </aside>
  )
}
