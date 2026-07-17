import { describe, expect, it } from 'vitest'
import {
  normalizeUrlPayload,
  hostnameOf,
  urlHtmlToText,
  buildProxyUrl,
} from '../../continuance/src/lib/urlSource.js'

const URL = 'https://example.com/data'

describe('buildProxyUrl', () => {
  it('routes a target through the proxy as an encoded ?url= param', () => {
    expect(
      buildProxyUrl('https://cors-proxy.vaporwavemall.com/', 'https://arxiv.org/abs/2607.13309')
    ).toBe(
      'https://cors-proxy.vaporwavemall.com/?url=https%3A%2F%2Farxiv.org%2Fabs%2F2607.13309'
    )
  })

  it('uses & when the proxy base already has a query string', () => {
    expect(buildProxyUrl('https://p.example/go?x=1', 'https://a.test/')).toBe(
      'https://p.example/go?x=1&url=https%3A%2F%2Fa.test%2F'
    )
  })

  it('fetches directly when no proxy base is set', () => {
    expect(buildProxyUrl('', 'https://a.test/')).toBe('https://a.test/')
    expect(buildProxyUrl(undefined, 'https://a.test/')).toBe('https://a.test/')
  })
})

describe('hostnameOf', () => {
  it('extracts the host, falling back to the raw string', () => {
    expect(hostnameOf('https://nor.the-rn.info/rm_ation/feed.json')).toBe(
      'nor.the-rn.info'
    )
    expect(hostnameOf('not a url')).toBe('not a url')
  })
})

describe('urlHtmlToText', () => {
  it('strips tags, scripts, and entities', () => {
    expect(
      urlHtmlToText('<style>x{}</style><p>a &amp; <b>b</b></p><script>y()</script>')
    ).toBe('a b')
  })
})

describe('normalizeUrlPayload', () => {
  it('maps a JSON Feed (items[]) to records with feed-item type', () => {
    const records = normalizeUrlPayload(URL, {
      version: 'https://jsonfeed.org/version/1.1',
      items: [
        {
          id: 'https://example.com/a',
          title: 'Alpha',
          content_html: '<p>hello <b>world</b></p>',
          tags: ['x', '', 'y'],
          date_published: '2026-01-01T00:00:00Z',
        },
      ],
    })
    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({
      id: 'https://example.com/a',
      sourceId: '__url__',
      title: 'Alpha',
      text: 'hello world',
      url: 'https://example.com/a',
      tags: ['x', 'y'],
      type: 'feed-item',
    })
  })

  it('stamps a caller-supplied sourceId on every record (e.g. a named feed)', () => {
    const records = normalizeUrlPayload(
      URL,
      { items: [{ id: 'a', title: 'A' }, { id: 'b', title: 'B' }] },
      'nor'
    )
    expect(records.map((r) => r.sourceId)).toEqual(['nor', 'nor'])
  })

  it('maps a generic JSON array, deriving title/text/url from common keys', () => {
    const records = normalizeUrlPayload(URL, [
      { name: 'First', body: 'body text', link: 'https://example.com/1' },
      'plain string',
    ])
    expect(records).toHaveLength(2)
    expect(records[0]).toMatchObject({
      title: 'First',
      text: 'body text',
      url: 'https://example.com/1',
      type: 'json',
      sourceId: '__url__',
    })
    // A primitive element becomes a single-line record with a positional title.
    expect(records[1]).toMatchObject({ title: 'Item 2', text: 'plain string' })
  })

  it('wraps a single JSON object as one record', () => {
    const records = normalizeUrlPayload(URL, { title: 'Solo', description: 'd' })
    expect(records).toHaveLength(1)
    expect(records[0].title).toBe('Solo')
    expect(records[0].summary).toBe('d')
  })

  it('reduces HTML/text to one page record with a title from <title>', () => {
    const records = normalizeUrlPayload(
      URL,
      '<html><head><title>Doc Title</title></head><body><p>Body copy here</p></body></html>'
    )
    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({
      title: 'Doc Title',
      type: 'page',
      url: URL,
      sourceId: '__url__',
    })
    expect(records[0].text).toContain('Body copy here')
  })

  it('returns no records for empty content', () => {
    expect(normalizeUrlPayload(URL, '')).toEqual([])
    expect(normalizeUrlPayload(URL, '   ')).toEqual([])
  })
})
