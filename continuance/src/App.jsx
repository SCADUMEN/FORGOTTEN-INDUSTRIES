import { useEffect, useMemo, useState } from 'react'
import Column from './components/Column.jsx'
import CrossReference from './components/CrossReference.jsx'
import BookmarkBar from './components/BookmarkBar.jsx'
import Dossier from './components/Dossier.jsx'
import CxrDossier from './components/CxrDossier.jsx'
import bannerUrl from './assets/continuance.gif'
import { useLocalStorage } from './lib/useLocalStorage.js'
import { loadManifest, loadSource, loadUrlSource, search } from './lib/sources.js'
import { relatedRecords, tokenize } from './lib/crossref.js'
import {
  bookmarkKey,
  isBookmarked,
  makeBookmark,
  toggleBookmark,
} from './lib/bookmarks.js'

const SITE_ORIGIN = 'https://forgotten-industries.net'

// Column-select sentinel for the runtime, user-pasted URL source.
const URL_SOURCE_ID = '__url__'

export default function App() {
  const [manifest, setManifest] = useState(null)
  const [manifestError, setManifestError] = useState(null)

  const [colA, setColA] = useLocalStorage('column-a', null)
  const [colB, setColB] = useLocalStorage('column-b', null)
  const [query, setQuery] = useLocalStorage('query', '')
  const [bookmarks, setBookmarks] = useLocalStorage('bookmarks', [])

  // Per-column URL for the runtime URL source, persisted so it refetches on reload.
  const [urlA, setUrlA] = useLocalStorage('url-a', '')
  const [urlB, setUrlB] = useLocalStorage('url-b', '')

  const [sourceA, setSourceA] = useState(null)
  const [sourceB, setSourceB] = useState(null)
  const [loadingA, setLoadingA] = useState(false)
  const [loadingB, setLoadingB] = useState(false)
  const [errorA, setErrorA] = useState(null)
  const [errorB, setErrorB] = useState(null)

  // { side: 'A' | 'B', record } - the cross-reference anchor.
  const [anchor, setAnchor] = useState(null)

  // Load the manifest once, then seed each column to a sensible default source
  // when localStorage has none yet (A = first source, B = second or first).
  useEffect(() => {
    let cancelled = false
    loadManifest()
      .then((data) => {
        if (cancelled) return
        setManifest(data)
        const ids = data.sources.map((source) => source.id)
        // Leave a URL selection intact; it isn't a manifest source.
        if (colA !== URL_SOURCE_ID && !ids.includes(colA))
          setColA(ids[0] ?? null)
        if (colB !== URL_SOURCE_ID && !ids.includes(colB))
          setColB(ids[1] ?? ids[0] ?? null)
      })
      .catch((err) => !cancelled && setManifestError(err.message))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useLoadedSource(colA, urlA, setSourceA, setLoadingA, setErrorA)
  useLoadedSource(colB, urlB, setSourceB, setLoadingB, setErrorB)

  // Drop the anchor only when its OWN column swaps to a different source (its
  // record no longer belongs there). Changing the opposite column keeps the
  // anchor and just re-scores the cross-reference. Because a restored anchor's
  // side source always matches its record, this never fires on restore.
  useEffect(() => {
    if (!anchor) return
    const sideSource = anchor.side === 'A' ? colA : colB
    if (anchor.record.sourceId !== sideSource) setAnchor(null)
  }, [colA, colB, anchor])

  const queryTerms = useMemo(() => tokenize(query), [query])

  const resultsA = useMemo(
    () => (sourceA ? search(sourceA, query) : []),
    [sourceA, query]
  )
  const resultsB = useMemo(
    () => (sourceB ? search(sourceB, query) : []),
    [sourceB, query]
  )

  // Cross-reference the anchor against the opposite column's full record set.
  const targetSource = anchor?.side === 'A' ? sourceB : sourceA
  const related = useMemo(
    () =>
      anchor && targetSource
        ? relatedRecords(anchor.record, targetSource.records)
        : [],
    [anchor, targetSource]
  )

  // The current cross-reference's bookmark identity, and whether it's saved.
  const currentKey = anchor
    ? bookmarkKey({
        colA,
        colB,
        anchorSide: anchor.side,
        anchorId: anchor.record.id,
      })
    : null
  const isSaved = isBookmarked(bookmarks, currentKey)

  const handleBookmark = () => {
    if (!anchor) return
    const bookmark = makeBookmark(
      { colA, colB, query, anchorSide: anchor.side, record: anchor.record },
      Date.now()
    )
    setBookmarks((list) => toggleBookmark(list, bookmark))
  }

  // Recall a saved cross-reference: reselect both sources, refill the query, and
  // re-anchor the post. The source-consistency guard above leaves this anchor in
  // place because the restored state is self-consistent.
  const handleRestore = (bookmark) => {
    setColA(bookmark.colA)
    setColB(bookmark.colB)
    setQuery(bookmark.query)
    setAnchor({ side: bookmark.anchorSide, record: bookmark.anchor })
  }

  const handleRemoveBookmark = (key) => {
    setBookmarks((list) => list.filter((b) => b.key !== key))
  }

  if (manifestError) {
    return (
      <div className="continuance-shell" id="continuance-main">
        <p className="continuance-error" role="alert">
          CxR could not load its sources: {manifestError}
        </p>
      </div>
    )
  }

  if (!manifest) {
    return (
      <div className="continuance-shell" id="continuance-main">
        <p className="fi-caption-box">
          <span className="fi-prompt-marker">&gt;</span> INITIALIZING
        </p>
      </div>
    )
  }

  return (
    <>
      <header className="continuance-masthead">
        <div
          className="continuance-masthead-banner"
          style={{ backgroundImage: `url(${bannerUrl})` }}
        >
          <div className="continuance-masthead-inner">
            <p className="section-label">
              &gt; Les Instruments / research interface
            </p>
            <h1>CONTINUANCExRESEARCH</h1>
            <p className="continuance-tagline">
              Search and cross-reference archive sources, two at a time. The
              work continues.
            </p>
          </div>
        </div>
        <div className="continuance-masthead-dossiers">
          <Dossier />
          <CxrDossier />
        </div>
      </header>

      <div className="continuance-shell" id="continuance-main">
        <div className="continuance-searchbar">
          <label className="continuance-search-field">
            <span className="sr-only">Search both sources</span>
            <input
              type="search"
              value={query}
              placeholder="Search both sources…"
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
            />
          </label>
        </div>

        <BookmarkBar
          bookmarks={bookmarks}
          manifest={manifest}
          onRestore={handleRestore}
          onRemove={handleRemoveBookmark}
        />

        {/* 1 / 2 / 1 workspace: the two source columns flank a wider central
            cross-reference panel. */}
        <div className="continuance-workspace">
          <Column
            side="A"
            manifest={manifest}
            sourceId={colA ?? ''}
            onSourceChange={setColA}
            urlValue={colA === URL_SOURCE_ID ? urlA : ''}
            onUrlChange={setUrlA}
            results={resultsA}
            queryTerms={queryTerms}
            loading={loadingA}
            error={errorA}
            selectedId={anchor?.side === 'A' ? anchor.record.id : null}
            onSelect={(record) => setAnchor({ side: 'A', record })}
          />

          <CrossReference
            anchor={anchor?.record ?? null}
            anchorSide={anchor?.side ?? ''}
            targetLabel={
              (anchor?.side === 'A' ? sourceB : sourceA)?.label ??
              'the other source'
            }
            related={related}
            onBookmark={handleBookmark}
            isSaved={isSaved}
            onOpen={(record) => {
              const url = record.url?.startsWith('http')
                ? record.url
                : `${SITE_ORIGIN}${record.url || ''}`
              if (record.url) window.open(url, '_blank', 'noopener')
            }}
          />

          <Column
            side="B"
            manifest={manifest}
            sourceId={colB ?? ''}
            onSourceChange={setColB}
            urlValue={colB === URL_SOURCE_ID ? urlB : ''}
            onUrlChange={setUrlB}
            results={resultsB}
            queryTerms={queryTerms}
            loading={loadingB}
            error={errorB}
            selectedId={anchor?.side === 'B' ? anchor.record.id : null}
            onSelect={(record) => setAnchor({ side: 'B', record })}
          />
        </div>
      </div>
    </>
  )
}

// Load a source's records whenever the selected id (or, for the URL source, its
// URL) changes. The URL source fetches client-side and may fail on CORS or a bad
// URL - that surfaces through setError so the column can explain it.
function useLoadedSource(id, url, setSource, setLoading, setError) {
  useEffect(() => {
    setError(null)
    if (!id) {
      setSource(null)
      return
    }
    // URL selected but nothing entered yet: nothing to load.
    if (id === URL_SOURCE_ID && !url) {
      setSource(null)
      return
    }
    let cancelled = false
    setLoading(true)
    const pending = id === URL_SOURCE_ID ? loadUrlSource(url) : loadSource(id)
    pending
      .then((data) => !cancelled && setSource(data))
      .catch((err) => {
        if (cancelled) return
        setSource(
          id === URL_SOURCE_ID
            ? { id: URL_SOURCE_ID, label: 'URL', records: [] }
            : { id, label: id, records: [] }
        )
        setError(
          id === URL_SOURCE_ID
            ? `Could not load that URL (${err.message}). It may be unreachable, or the CORS proxy may be unavailable.`
            : `Could not load source (${err.message}).`
        )
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [id, url, setSource, setLoading, setError])
}
