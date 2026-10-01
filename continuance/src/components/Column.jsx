import { useState } from 'react'
import Snippet from './Snippet.jsx'
import { URL_SOURCE_ID } from '../lib/urlSource.js'

// Cap rendered rows so an empty query (every record) does not paint a 160-row
// DOM. The count stays honest; a note flags the cap when it bites.
const RENDER_LIMIT = 50

// URL field for a URL column. The draft stays local until submitted, so we
// don't refetch on every keystroke. Column keys this by the committed URL, so
// an outside change (reload, bookmark restore) remounts it with a fresh draft.
function UrlEntry({ side, urlValue, onUrlChange }) {
  const [draftUrl, setDraftUrl] = useState(urlValue || '')
  return (
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
  )
}

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
        <UrlEntry
          key={urlValue}
          side={side}
          urlValue={urlValue}
          onUrlChange={onUrlChange}
        />
      ) : null}

      {error ? (
        <p className="continuance-error" role="alert">
          {error}
        </p>
      ) : (
        <ol className="continuance-results">
          {results.slice(0, RENDER_LIMIT).map((record, index) => {
            const selected = record.id === selectedId
            // The title names the button; the type, excerpt, and tags describe
            // it, so a screen reader hears the title first, not the whole card.
            const baseId = `continuance-${side}-${index}`
            return (
              <li key={record.id}>
                <button
                  type="button"
                  className={`continuance-result${selected ? ' is-selected' : ''}`}
                  aria-pressed={selected}
                  aria-labelledby={`${baseId}-title`}
                  aria-describedby={`${baseId}-detail`}
                  onClick={() => onSelect(record)}
                >
                  <span
                    id={`${baseId}-title`}
                    className="continuance-result-title"
                  >
                    {record.title}
                  </span>
                  <span id={`${baseId}-detail`}>
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
                  </span>
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
