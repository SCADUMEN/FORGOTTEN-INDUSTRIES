import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  cleanRecords,
  loadManifest,
  loadSource,
  search,
} from '../../continuance/src/lib/sources.js'
import { matchesShape } from '../../continuance/src/lib/useLocalStorage.js'

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('loadSource / loadManifest retry', () => {
  it('evicts a failed load so selecting the source again retries', async () => {
    const manifest = { sources: [{ id: 'retry-src', label: 'Retry' }] }
    const records = [{ id: 'r1', title: 'Recovered', text: '', tags: [] }]
    const fetchMock = vi
      .fn()
      // First attempt: manifest fails outright.
      .mockResolvedValueOnce(new Response('down', { status: 503 }))
      // Second attempt: manifest loads, then the source loads.
      .mockResolvedValueOnce(jsonResponse(manifest))
      .mockResolvedValueOnce(jsonResponse({ id: 'retry-src', records }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(loadSource('retry-src')).rejects.toThrow(/503/)
    await expect(loadManifest()).resolves.toEqual(manifest)
    const source = await loadSource('retry-src')
    expect(source.records.map((r) => r.id)).toEqual(['r1'])
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })
})

describe('cleanRecords', () => {
  it('drops duplicate ids and duplicate tags, keeping first occurrences', () => {
    const cleaned = cleanRecords([
      { id: 'a', tags: ['x', 'y', 'x', '', null] },
      { id: 'a', tags: ['ignored'] },
      { id: 'b' },
    ])
    expect(cleaned).toEqual([
      { id: 'a', tags: ['x', 'y'] },
      { id: 'b', tags: [] },
    ])
  })
})

describe('search', () => {
  it('keeps indexes per source object, so an empty placeholder never sticks', () => {
    const placeholder = { id: 'same-id', records: [] }
    const loaded = {
      id: 'same-id',
      records: [{ id: 'hit', title: 'Lighthouse', text: '', tags: [] }],
    }
    expect(search(placeholder, 'lighthouse')).toEqual([])
    expect(search(loaded, 'lighthouse').map((r) => r.id)).toEqual(['hit'])
  })
})

describe('matchesShape', () => {
  it('accepts values shaped like the initial value', () => {
    expect(matchesShape([], [])).toBe(true)
    expect(matchesShape('q', '')).toBe(true)
    expect(matchesShape('fi', null)).toBe(true)
    expect(matchesShape(null, null)).toBe(true)
  })

  it('rejects wrong-shaped stored values', () => {
    expect(matchesShape({ length: 1 }, [])).toBe(false)
    expect(matchesShape(42, '')).toBe(false)
    expect(matchesShape({}, null)).toBe(false)
  })
})
