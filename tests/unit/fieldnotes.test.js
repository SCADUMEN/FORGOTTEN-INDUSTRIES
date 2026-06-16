import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import fetchFieldNotes, {
  blueskyPostUrl,
  normalizePost,
} from '../../src/_data/fieldnotes.cjs'

const ACTOR = 'forgotten-industry.bsky.social'

// Build a minimal feed item shaped like the Bluesky getAuthorFeed response.
function feedItem(overrides = {}) {
  return {
    post: {
      uri: 'at://did:plc:abc/app.bsky.feed.post/rkey123',
      likeCount: 3,
      repostCount: 2,
      replyCount: 1,
      indexedAt: '2026-06-01T00:00:00.000Z',
      record: { text: 'a bench note', createdAt: '2026-06-02T00:00:00.000Z' },
      author: { handle: ACTOR },
      ...overrides.post,
    },
  }
}

describe('blueskyPostUrl', () => {
  it('builds a profile post URL from the rkey (last path segment)', () => {
    expect(blueskyPostUrl('at://did:plc:abc/app.bsky.feed.post/rkey123')).toBe(
      `https://bsky.app/profile/${ACTOR}/post/rkey123`
    )
  })

  it('respects a custom handle argument', () => {
    expect(
      blueskyPostUrl('at://did:plc:abc/app.bsky.feed.post/xyz', 'someone.test')
    ).toBe('https://bsky.app/profile/someone.test/post/xyz')
  })
})

describe('normalizePost', () => {
  it('maps a valid item to the normalized shape', () => {
    const result = normalizePost(feedItem())
    expect(result).toEqual({
      id: 'at://did:plc:abc/app.bsky.feed.post/rkey123',
      text: 'a bench note',
      createdAt: new Date('2026-06-02T00:00:00.000Z'),
      url: `https://bsky.app/profile/${ACTOR}/post/rkey123`,
      likeCount: 3,
      repostCount: 2,
      replyCount: 1,
    })
  })

  it('falls back to indexedAt when record.createdAt is absent', () => {
    const result = normalizePost(
      feedItem({ post: { record: { text: 'note' } } })
    )
    expect(result.createdAt).toEqual(new Date('2026-06-01T00:00:00.000Z'))
  })

  it('defaults engagement counts to 0', () => {
    const result = normalizePost(
      feedItem({
        post: {
          likeCount: undefined,
          repostCount: undefined,
          replyCount: undefined,
        },
      })
    )
    expect(result.likeCount).toBe(0)
    expect(result.repostCount).toBe(0)
    expect(result.replyCount).toBe(0)
  })

  it('returns null when post.uri is missing', () => {
    expect(normalizePost(feedItem({ post: { uri: undefined } }))).toBeNull()
  })

  it('returns null when record.text is missing', () => {
    expect(normalizePost(feedItem({ post: { record: {} } }))).toBeNull()
  })

  it('returns null when the author handle is not the archive actor', () => {
    expect(
      normalizePost(feedItem({ post: { author: { handle: 'other.bsky' } } }))
    ).toBeNull()
  })
})

describe('fetchFieldNotes (default export)', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete global.fetch
  })

  it('returns normalized posts sorted newest-first and drops invalid entries', async () => {
    const older = feedItem({
      post: {
        uri: 'at://did:plc:abc/app.bsky.feed.post/old',
        record: { text: 'older', createdAt: '2026-06-01T00:00:00.000Z' },
      },
    })
    const newer = feedItem({
      post: {
        uri: 'at://did:plc:abc/app.bsky.feed.post/new',
        record: { text: 'newer', createdAt: '2026-06-05T00:00:00.000Z' },
      },
    })
    const invalid = feedItem({ post: { author: { handle: 'other.bsky' } } })

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ feed: [older, newer, invalid] }),
    })

    const result = await fetchFieldNotes()
    expect(result.map((p) => p.text)).toEqual(['newer', 'older'])
  })

  it('returns [] and warns on a non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
    })

    expect(await fetchFieldNotes()).toEqual([])
    expect(console.warn).toHaveBeenCalled()
  })

  it('returns [] and warns when fetch rejects (timeout/abort)', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('aborted'))

    expect(await fetchFieldNotes()).toEqual([])
    expect(console.warn).toHaveBeenCalled()
  })

  it('returns [] when the response has no feed key', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    })

    expect(await fetchFieldNotes()).toEqual([])
  })
})
