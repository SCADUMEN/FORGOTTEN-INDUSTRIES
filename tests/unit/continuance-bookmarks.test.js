import { describe, expect, it } from 'vitest'
import {
  bookmarkKey,
  makeBookmark,
  toggleBookmark,
  upsertBookmark,
  isBookmarked,
} from '../../continuance/src/lib/bookmarks.js'

const record = {
  id: 'post:le-signal',
  sourceId: 'fi',
  title: 'Le Signal',
  tags: ['preservation'],
  summary: 'a summary',
  text: 'full body',
}

describe('bookmarkKey', () => {
  it('is stable for the same configuration and excludes the query', () => {
    const base = { colA: 'fi', colB: 'nor', anchorSide: 'A', anchorId: 'x' }
    expect(bookmarkKey(base)).toBe('fi|nor|A|x')
    // Same tuple, regardless of query, yields the same key.
    expect(bookmarkKey(base)).toBe(bookmarkKey({ ...base }))
  })

  it('differs when any identity field differs', () => {
    const k = bookmarkKey({
      colA: 'fi',
      colB: 'nor',
      anchorSide: 'A',
      anchorId: 'x',
    })
    expect(k).not.toBe(
      bookmarkKey({ colA: 'nor', colB: 'fi', anchorSide: 'A', anchorId: 'x' })
    )
    expect(k).not.toBe(
      bookmarkKey({ colA: 'fi', colB: 'nor', anchorSide: 'B', anchorId: 'x' })
    )
  })
})

describe('makeBookmark', () => {
  it('captures the full state and stores the anchor record whole', () => {
    const bm = makeBookmark(
      { colA: 'fi', colB: 'nor', query: 'signal', anchorSide: 'A', record },
      1234
    )
    expect(bm).toMatchObject({
      key: 'fi|nor|A|post:le-signal',
      savedAt: 1234,
      colA: 'fi',
      colB: 'nor',
      query: 'signal',
      anchorSide: 'A',
    })
    // The whole record is retained so restore/re-scoring needs nothing loaded.
    expect(bm.anchor).toBe(record)
    expect(bm.anchor.text).toBe('full body')
  })

  it('coerces a missing query to an empty string', () => {
    const bm = makeBookmark(
      { colA: 'fi', colB: 'nor', query: undefined, anchorSide: 'B', record },
      1
    )
    expect(bm.query).toBe('')
  })
})

describe('toggleBookmark', () => {
  const bm = makeBookmark(
    { colA: 'fi', colB: 'nor', query: 'q', anchorSide: 'A', record },
    1
  )

  it('adds when absent (newest first) and removes when present', () => {
    const added = toggleBookmark([], bm)
    expect(added).toHaveLength(1)
    expect(added[0].key).toBe(bm.key)

    const removed = toggleBookmark(added, bm)
    expect(removed).toHaveLength(0)
  })
})

describe('upsertBookmark', () => {
  it('refreshes an existing entry and moves it to the front', () => {
    const older = makeBookmark(
      { colA: 'fi', colB: 'nor', query: 'old', anchorSide: 'A', record },
      1
    )
    const other = makeBookmark(
      { colA: 'nor', colB: 'fi', query: '', anchorSide: 'B', record },
      2
    )
    const list = [other, older]

    const newer = makeBookmark(
      { colA: 'fi', colB: 'nor', query: 'new', anchorSide: 'A', record },
      3
    )
    const next = upsertBookmark(list, newer)

    // No duplicate; refreshed entry is first with the new query + savedAt.
    expect(next).toHaveLength(2)
    expect(next[0].key).toBe(newer.key)
    expect(next[0].query).toBe('new')
    expect(next[0].savedAt).toBe(3)
  })
})

describe('isBookmarked', () => {
  const list = [
    makeBookmark(
      { colA: 'fi', colB: 'nor', query: '', anchorSide: 'A', record },
      1
    ),
  ]
  it('matches by key and tolerates a null key', () => {
    expect(isBookmarked(list, 'fi|nor|A|post:le-signal')).toBe(true)
    expect(isBookmarked(list, 'fi|nor|B|post:le-signal')).toBe(false)
    expect(isBookmarked(list, null)).toBe(false)
  })
})
