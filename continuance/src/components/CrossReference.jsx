// The cross-reference panel. Given the anchor record selected in one column,
// it lists the records in the OTHER column that share the most meaning, and
// shows the terms and tags each match was made on so the link is legible.
//
// The panel stays mounted in both states so its live region persists: screen
// readers hear a one-line status when the anchor changes, not the whole list.
export default function CrossReference({
  anchor,
  anchorSide,
  targetLabel,
  related,
  hrefFor,
  onBookmark,
  isSaved,
}) {
  const status = anchor
    ? `${related.length} related in ${targetLabel} for ${anchor.title}.`
    : ''

  return (
    <aside
      className={`continuance-crossref${anchor ? '' : ' is-empty'}`}
      aria-label="Cross-reference"
    >
      <p className="sr-only" aria-live="polite">
        {status}
      </p>
      {anchor ? (
        <AnchoredPanel
          anchor={anchor}
          anchorSide={anchorSide}
          targetLabel={targetLabel}
          related={related}
          hrefFor={hrefFor}
          onBookmark={onBookmark}
          isSaved={isSaved}
        />
      ) : (
        <>
          <p className="section-label">&gt; Cross-Reference</p>
          <p className="continuance-crossref-hint">
            Select a record in either column to surface related records from the
            other source.
          </p>
        </>
      )}
    </aside>
  )
}

function AnchoredPanel({
  anchor,
  anchorSide,
  targetLabel,
  related,
  hrefFor,
  onBookmark,
  isSaved,
}) {
  return (
    <>
      <div className="continuance-crossref-head">
        <p className="section-label">&gt; Cross-Reference</p>
        {/* A toggle keeps one accessible name; aria-pressed carries the
            state. The visible Bookmark/Saved text is presentational. */}
        <button
          type="button"
          className="continuance-bookmark-save"
          aria-label="Bookmark this cross-reference"
          aria-pressed={isSaved}
          onClick={onBookmark}
        >
          <span aria-hidden="true">{isSaved ? 'Saved' : 'Bookmark'}</span>
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
        {related.map(({ record, sharedTerms, sharedTags, score }) => {
          const href = hrefFor(record)
          const body = (
            <>
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
            </>
          )
          return (
            <li key={record.id}>
              {href ? (
                <a
                  className="continuance-crossref-item"
                  href={href}
                  target="_blank"
                  rel="noopener"
                >
                  {body}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              ) : (
                <div className="continuance-crossref-item is-static">
                  {body}
                </div>
              )}
            </li>
          )
        })}
        {related.length === 0 ? (
          <li className="continuance-empty">
            No shared terms with {targetLabel}.
          </li>
        ) : null}
      </ol>
    </>
  )
}
