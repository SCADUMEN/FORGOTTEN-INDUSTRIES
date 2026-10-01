import { useEffect, useMemo, useState } from 'react'
import Column from './components/Column.jsx'
import CrossReference from './components/CrossReference.jsx'
import BookmarkBar from './components/BookmarkBar.jsx'
import Dossier from './components/Dossier.jsx'
import CxrDossier from './components/CxrDossier.jsx'
import bannerUrl from './assets/continuance.gif'
import { useLocalStorage } from './lib/useLocalStorage.js'
import {
  loadManifest,
  loadSource,
  loadUrlSource,
  search,
} from './lib/sources.js'
import { URL_SOURCE_ID } from './lib/urlSource.js'
import { relatedRecords, tokenize } from './lib/crossref.js'
import {
  bookmarkKey,
  isBookmarked,
  isValidBookmark,
  makeBookmark,
  toggleBookmark,
} from './lib/bookmarks.js'

const SITE_ORIGIN = 'https://forgotten-industries.net'

// Absolute link for a record: external URLs as-is, archive paths resolved
// against the site. Records without a URL have no link.
function recordHref(record) {
  if (!record.url) return null
  return record.url.startsWith('http')
    ? record.url
    : `${SITE_ORIGIN}${record.url}`
}

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

  // { side: 'A' | 'B', record, url } - the cross-reference anchor. `url` is the
  // anchor column's URL when that column is a URL source, else null.
  const [anchor, setAnchor] = useState(null)

  // Load the manifest once, then seed each column to a sensible default source
  // when localStorage has none yet (A = first source, B = second or first).
  // Functional updaters read the current selection, so the effect needs no
  // dependencies.
  useEffect(() => {
    let cancelled = false
    loadManifest()
      .then((data) => {
        if (cancelled) return
        setManifest(data)
        const ids = data.sources.map((source) => source.id)
        // Leave a URL selection intact; it isn't a manifest source.
        const keep = (col) => col === URL_SOURCE_ID || ids.includes(col)
        setColA((col) => (keep(col) ? col : (ids[0] ?? null)))
        setColB((col) => (keep(col) ? col : (ids[1] ?? ids[0] ?? null)))
      })
      .catch((err) => !cancelled && setManifestError(err.message))
    return () => {
      cancelled = true
    }
  }, [setColA, setColB])

  useLoadedSource(colA, urlA, setSourceA, setLoadingA, setErrorA)
  useLoadedSource(colB, urlB, setSourceB, setLoadingB, setErrorB)

  // Drop the anchor only when its OWN column swaps to a different source (its
  // record no longer belongs there), including a URL column loading a
  // different URL. Changing the opposite column keeps the anchor and just
  // re-scores the cross-reference. A restored anchor carries the restored
  // column's URL, so this never fires on restore.
  useEffect(() => {
    if (!anchor) return
    const sideSource = anchor.side === 'A' ? colA : colB
    const sideUrl = anchor.side === 'A' ? urlA : urlB
    const moved =
      anchor.record.sourceId !== sideSource ||
      (sideSource === URL_SOURCE_ID && anchor.url !== sideUrl)
    if (moved) setAnchor(null)
  }, [colA, colB, urlA, urlB, anchor])

  // Anything malformed in storage is ignored rather than crashing the chips.
  const savedBookmarks = useMemo(
    () => bookmarks.filter(isValidBookmark),
    [bookmarks]
  )

  const selectAnchor = (side, record) => {
    const col = side === 'A' ? colA : colB
    const url = side === 'A' ? urlA : urlB
    setAnchor({ side, record, url: col === URL_SOURCE_ID ? url : null })
  }

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
        urlA,
        urlB,
        anchorSide: anchor.side,
        anchorId: anchor.record.id,
      })
    : null
  const isSaved = isBookmarked(savedBookmarks, currentKey)

  const handleBookmark = () => {
    if (!anchor) return
    const bookmark = makeBookmark(
      {
        colA,
        colB,
        urlA,
        urlB,
        query,
        anchorSide: anchor.side,
        record: anchor.record,
      },
      Date.now()
    )
    setBookmarks((list) =>
      toggleBookmark(list.filter(isValidBookmark), bookmark)
    )
  }

  // Recall a saved cross-reference: reselect both sources and any URLs, refill
  // the query, and re-anchor the post. The source-consistency guard above
  // leaves this anchor in place because the restored state is self-consistent.
  // Bookmarks saved before URLs were tracked keep the column's current URL.
  const handleRestore = (bookmark) => {
    const restoredUrlA = bookmark.urlA ?? urlA
    const restoredUrlB = bookmark.urlB ?? urlB
    setColA(bookmark.colA)
    setColB(bookmark.colB)
    setUrlA(restoredUrlA)
    setUrlB(restoredUrlB)
    setQuery(bookmark.query)
    const anchorCol =
      bookmark.anchorSide === 'A' ? bookmark.colA : bookmark.colB
    const anchorUrl = bookmark.anchorSide === 'A' ? restoredUrlA : restoredUrlB
    setAnchor({
      side: bookmark.anchorSide,
      record: bookmark.anchor,
      url: anchorCol === URL_SOURCE_ID ? anchorUrl : null,
    })
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
              id="continuance-search"
              type="search"
              value={query}
              placeholder="Search both sources…"
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
            />
          </label>
        </div>

        <BookmarkBar
          bookmarks={savedBookmarks}
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
            onSelect={(record) => selectAnchor('A', record)}
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
            hrefFor={recordHref}
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
            onSelect={(record) => selectAnchor('B', record)}
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
    // No source, or URL selected with nothing entered yet: nothing to load.
    // Clear loading too, since a load this effect superseded may have set it.
    if (!id || (id === URL_SOURCE_ID && !url)) {
      setSource(null)
      setLoading(false)
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
