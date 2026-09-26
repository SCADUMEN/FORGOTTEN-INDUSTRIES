import { describe, expect, it, vi } from 'vitest'
import worker from '../../src/worker/index.js'

const ENDPOINT = 'https://forgotten-industries.net/api/sightings'

// Minimal D1 stand-in: records every bound insert and returns `rows` for reads.
// `fail` makes every statement reject, as a D1 outage would.
function fakeDb({ rows = [], fail = false } = {}) {
  const inserts = []
  const statement = (sql) => ({
    bind: (...args) => ({
      run: async () => {
        if (fail) throw new Error('D1 unavailable')
        inserts.push({ sql, args })
      },
    }),
    all: async () => {
      if (fail) throw new Error('D1 unavailable')
      return { results: rows }
    },
  })
  return { prepare: vi.fn(statement), inserts }
}

function post(body, env) {
  return worker.fetch(
    new Request(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
    env
  )
}

// Keep the Worker's intentional console.error output out of the test log.
vi.spyOn(console, 'error').mockImplementation(() => {})

const VALID = { city: 'Duluth', seenAt: '2026-09-01', note: 'Seen at dusk.' }

describe('POST /api/sightings', () => {
  it.each([['null'], ['[]'], ['42'], ['"text"']])(
    'rejects a non-object JSON body (%s) with 400',
    async (raw) => {
      const env = { DB: fakeDb() }
      const res = await post(raw, env)
      expect(res.status).toBe(400)
      expect(await res.json()).toEqual({ error: 'Malformed request.' })
      expect(env.DB.inserts).toHaveLength(0)
    }
  )

  it('caps an oversized seenAt before it reaches D1', async () => {
    const env = { DB: fakeDb() }
    const res = await post(
      { ...VALID, seenAt: `2026-09-01${' '.repeat(5)}${'x'.repeat(500)}` },
      env
    )
    // Truncated to 40 chars the value no longer parses as a date.
    expect(res.status).toBe(400)
    expect(env.DB.inserts).toHaveLength(0)
  })

  it('stores a valid sighting', async () => {
    const env = { DB: fakeDb() }
    const res = await post({ ...VALID, colors: ['green', 'neon'] }, env)
    expect(res.status).toBe(200)
    expect(env.DB.inserts).toHaveLength(1)
    expect(env.DB.inserts[0].args[4]).toBe('["green"]')
  })

  it('returns a JSON 500 when the insert fails', async () => {
    const res = await post(VALID, { DB: fakeDb({ fail: true }) })
    expect(res.status).toBe(500)
    expect(await res.json()).toHaveProperty('error')
  })
})

describe('GET /api/sightings', () => {
  it('tolerates a row with an unparseable colors column', async () => {
    const env = {
      DB: fakeDb({
        rows: [
          {
            id: 'a',
            city: 'Duluth',
            seen_at: '2026-09-01',
            note: 'n',
            colors: '{not json',
            logged_at: 1,
          },
        ],
      }),
    }
    const res = await worker.fetch(new Request(ENDPOINT), env)
    expect(res.status).toBe(200)
    const { sightings } = await res.json()
    expect(sightings[0].colors).toEqual([])
  })

  it('returns a JSON 500 when the read fails', async () => {
    const res = await worker.fetch(new Request(ENDPOINT), {
      DB: fakeDb({ fail: true }),
    })
    expect(res.status).toBe(500)
    expect(await res.json()).toHaveProperty('error')
  })
})

describe('non-API paths', () => {
  it('passes through to the assets binding', async () => {
    const assets = { fetch: vi.fn(async () => new Response('page')) }
    const res = await worker.fetch(
      new Request('https://forgotten-industries.net/missing/'),
      { ASSETS: assets }
    )
    expect(assets.fetch).toHaveBeenCalledOnce()
    expect(await res.text()).toBe('page')
  })
})
