import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import feedEntries from '../../scripts/lib/feed-entries.cjs'

const { buildFeedStream, fieldLogFeedHtml, sitemapLastmods, videoFeedHtml } =
  feedEntries

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..'
)
const SITE = path.join(ROOT, '_site')
const ORIGIN = 'https://forgotten-industries.net'

function readSite(relativePath) {
  return fs.readFileSync(path.join(SITE, relativePath), 'utf8')
}

function entriesOf(xml) {
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, body]) => ({
    id: body.match(/<id>([^<]+)<\/id>/)[1],
    updated: body.match(/<updated>([^<]+)<\/updated>/)[1],
    kind: body.match(/<category term="([a-z]+)"/)[1],
  }))
}

const linkify = (value) =>
  String(value).replace(
    /(^|\s)(\/[a-z-]+\/)/g,
    (match, pre, route) => `${pre}<a href="${route}">${route}</a>`
  )

describe('feed stream', () => {
  const stream = buildFeedStream(
    {
      posts: [
        {
          url: '/posts/2026-10-01-against-forgetting.html',
          date: new Date('2026-10-01T00:00:00Z'),
          data: { title: 'Against Forgetting' },
        },
      ],
      fieldLogs: [
        {
          slug: 'atlas-report-2026-10-02-test',
          title: 'ATLAS Report 2026.10.02',
          date: '2026-10-02',
          sections: [],
        },
      ],
      videos: [
        {
          id: 'abc',
          kind: 'short',
          title: 'A short',
          url: 'https://www.youtube.com/shorts/abc',
          published: '2026-09-30T12:00:00+00:00',
          description: 'First line.\n\nSecond.',
          thumbnail: 'https://i.ytimg.com/vi/abc/hqdefault.jpg',
        },
      ],
    },
    { linkifyRoutes: linkify }
  )

  it('merges all three streams newest first', () => {
    expect(stream.map((entry) => entry.kind)).toEqual([
      'atlas',
      'oeuvre',
      'video',
    ])
  })

  it('keeps the absolute post URL the plugin feed used as the entry id', () => {
    expect(stream[1].url).toBe(
      `${ORIGIN}/posts/2026-10-01-against-forgetting.html`
    )
  })

  it('summarizes a video with its first paragraph', () => {
    expect(stream[2].summary).toBe('First line.')
    expect(stream[2].label).toBe('YouTube Short')
  })
})

describe('feed entry html', () => {
  it('makes linkified routes in ATLAS reports absolute', () => {
    const html = fieldLogFeedHtml(
      {
        summary: 'S',
        sections: [{ heading: 'STATUS', body: 'SEE /bull-valley/ NOW' }],
        sources: [{ label: 'PR', url: 'https://github.com/x/y/pull/1' }],
      },
      linkify
    )
    expect(html).toContain(`<a href="${ORIGIN}/bull-valley/">`)
    expect(html).not.toContain('href="/')
    expect(html).toContain('<a href="https://github.com/x/y/pull/1">PR</a>')
  })

  it('escapes video descriptions', () => {
    const html = videoFeedHtml({
      url: 'https://www.youtube.com/shorts/abc',
      thumbnail: 'https://i.ytimg.com/vi/abc/hqdefault.jpg',
      title: 'A <b>short</b>',
      description: '8+4 pin <power>',
    })
    expect(html).toContain('8+4 pin &lt;power&gt;')
    expect(html).toContain('alt="A &lt;b&gt;short&lt;/b&gt;"')
  })
})

describe('sitemap lastmods', () => {
  it('dates posts, reports, and their indexes, and nothing else', () => {
    const lastmods = sitemapLastmods(
      {
        posts: [{ url: '/posts/a.html', date: new Date('2026-09-01') }],
        fieldLogs: [{ slug: 'r', date: '2026-10-01' }],
      },
      (value) => value
    )
    expect(lastmods.get('/posts/a.html')).toBe('2026-09-01')
    expect(lastmods.get('/atlas/r/')).toBe('2026-10-01')
    expect(lastmods.get('/atlas/')).toBe('2026-10-01')
    expect(lastmods.get('/')).toBe('2026-10-01')
    expect(lastmods.has('/about.html')).toBe(false)
  })
})

describe('built feeds', () => {
  const unified = readSite('feed.xml')
  const oeuvre = readSite('feed/oeuvre.xml')

  it('keeps the original feed id so readers treat it as the same feed', () => {
    expect(unified).toContain(`<id>${ORIGIN}/</id>`)
    expect(oeuvre).toContain(`<id>${ORIGIN}/feed/oeuvre.xml</id>`)
  })

  it('carries posts, ATLAS reports, and videos, newest first', () => {
    const entries = entriesOf(unified)
    const kinds = new Set(entries.map((entry) => entry.kind))
    expect([...kinds].sort()).toEqual(['atlas', 'oeuvre', 'video'])
    const dates = entries.map((entry) => entry.updated)
    expect(dates).toEqual([...dates].sort().reverse())
    expect(
      entries.some((entry) =>
        entry.id.endsWith('/atlas/atlas-report-2026-10-01-the-step-nobody-ran/')
      )
    ).toBe(true)
  })

  it('lists every committed video', () => {
    const youtube = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'src/_data/youtube.json'), 'utf8')
    )
    for (const video of youtube.videos) {
      expect(unified).toContain(`<id>${video.url}</id>`)
    }
  })

  it('keeps the L’Œuvre feed to posts only', () => {
    const kinds = new Set(entriesOf(oeuvre).map((entry) => entry.kind))
    expect([...kinds]).toEqual(['oeuvre'])
  })

  it('never leaves a root-relative link for a feed reader to misresolve', () => {
    expect(unified).not.toMatch(/href=&quot;\/(?!\/)/)
  })
})

describe('search hygiene', () => {
  it('lists no site snapshots in the sitemap and dates the newest report', () => {
    const sitemap = readSite('sitemap.xml')
    expect(sitemap).not.toContain('/site-snapshots/')
    expect(sitemap).toMatch(
      /the-step-nobody-ran\/<\/loc>\s*<lastmod>2026-10-01<\/lastmod>/
    )
  })

  it('serves site snapshots noindex', () => {
    expect(readSite('_headers')).toMatch(
      /\/site-snapshots\/\*\n\s+X-Robots-Tag: noindex/
    )
  })
})
