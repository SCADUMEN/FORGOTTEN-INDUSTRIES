import { useEffect, useState } from 'react'
import Snippet from './Snippet.jsx'

// Cap rendered rows so an empty query (every record) does not paint a 160-row
// DOM. The count stays honest; a note flags the cap when it bites.
const RENDER_LIMIT = 50

// Column-select sentinel for the runtime, user-pasted URL source.
const URL_SOURCE_ID = '__url__'

// One research column: a source picker, a SYSOUT result count, and the result
// list. Selecting a result promotes it as the cross-reference anchor. Choosing
// "URL…" reveals a field for a user-pasted URL fetched live in the browser.
export default function Column({
  side,
  manifest,
  sourceId,
  onSourceChange,
  urlValue,
  onUrlChange,
  results,
  queryTerms,
  loading,
  error,
  selectedId,
  onSelect,
}) {
  // Draft URL kept local until submitted, so we don't refetch on every
  // keystroke. Re-sync when the committed URL changes from outside (reload,
  // bookmark restore).
  const [draftUrl, setDraftUrl] = useState(urlValue || '')
  useEffect(() => {
    setDraftUrl(urlValue || '')
  }, [urlValue])

  return (
    <section
      className="continuance-column"
      aria-label={`${side} research column`}
    >
      <header className="continuance-column-head">
        <p className="section-label">&gt; {side} / Source</p>
        <label className="continuance-source-select">
          <span className="sr-only">Data source for {side} column</span>
          <select
            value={sourceId}
            onChange={(event) => onSourceChange(event.target.value)}
          >
            {manifest.sources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.label}
              </option>
            ))}
            <option value={URL_SOURCE_ID}>URL…</option>
          </select>
        </label>
        <p className="fi-caption-box">
          <span className="fi-prompt-marker">&gt;</span>{' '}
          {loading ? 'LOADING' : `RESULTS (${results.length})`}
        </p>
      </header>

      {sourceId === URL_SOURCE_ID ? (
        <form
          className="continuance-url-entry"
          onSubmit={(event) => {
            event.preventDefault()
            onUrlChange(draftUrl.trim())
          }}
        >
          <label className="sr-only" htmlFor={`continuance-url-${side}`}>
            URL to fetch for the {side} column
          </label>
          <input
            id={`continuance-url-${side}`}
            type="url"
            value={draftUrl}
            placeholder="https://…/feed.json"
            onChange={(event) => setDraftUrl(event.target.value)}
            autoComplete="off"
          />
          <button type="submit">Load</button>
        </form>
      ) : null}

      {error ? (
        <p className="continuance-error" role="alert">
          {error}
        </p>
      ) : (
        <ol className="continuance-results">
          {results.slice(0, RENDER_LIMIT).map((record) => {
            const selected = record.id === selectedId
            return (
              <li key={record.id}>
                <button
                  type="button"
                  className={`continuance-result${selected ? ' is-selected' : ''}`}
                  aria-pressed={selected}
                  onClick={() => onSelect(record)}
                >
                  <span className="continuance-result-title">
                    {record.title}
                  </span>
                  {record.type ? (
                    <span className="continuance-result-type">
                      {record.type}
                    </span>
                  ) : null}
                  <Snippet
                    text={record.text}
                    summary={record.summary}
                    terms={queryTerms}
                  />
                  {record.tags?.length ? (
                    <span className="continuance-tags">
                      {record.tags.slice(0, 6).map((tag) => (
                        <span key={tag} className="continuance-tag">
                          {tag}
                        </span>
                      ))}
                    </span>
                  ) : null}
                </button>
              </li>
            )
          })}
          {!loading && results.length === 0 ? (
            <li className="continuance-empty">No records match.</li>
          ) : null}
          {results.length > RENDER_LIMIT ? (
            <li className="continuance-more">
              Showing first {RENDER_LIMIT} of {results.length}. Refine the query
              to narrow.
            </li>
          ) : null}
        </ol>
      )}
    </section>
  )
}
