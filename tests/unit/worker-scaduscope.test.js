import { describe, expect, it, vi } from 'vitest'
import worker, { tagPoints } from '../../src/worker/index.js'
import {
  generateName,
  PLACES,
  SHORT_PLACES,
  TITLES,
  NOUNS,
  EPITHETS,
  GIVEN,
  NAME_SPACE,
} from '../../src/assets/js/bull-valley-scaduscope/names.js'

const ENDPOINT = 'https://forgotten-industries.net/api/scaduscope/tags'

// Minimal D1 stand-in for the two Scaduscope tables, kept in memory so the
// upserts and read-backs agree the way the real tables would. `fail` makes
// every statement reject, as a D1 outage would.
function fakeDb({ fail = false } = {}) {
  const state = { totals: null, names: new Map(), writes: 0 }
  const guard = () => {
    if (fail) throw new Error('D1 unavailable')
  }
  const prepare = vi.fn((sql) => {
    const exec = (args) => ({
      run: async () => {
        guard()
        state.writes++
        if (sql.includes('INTO scaduscope_totals')) {
          const [points] = args
          state.totals = state.totals
            ? {
                tags: state.totals.tags + 1,
                points: state.totals.points + points,
              }
            : { tags: 1, points }
        } else if (sql.includes('INTO scaduscope_names')) {
          const [name, , lastTaggedAt] = args
          const row = state.names.get(name)
          state.names.set(name, {
            tags: (row?.tags ?? 0) + 1,
            last_tagged_at: lastTaggedAt,
          })
        }
      },
      first: async () => {
        guard()
        if (sql.includes('FROM scaduscope_names')) {
          return state.names.get(args[0]) ?? null
        }
        return state.totals
      },
      // The recent-names read: newest first, limited by the bound LIMIT.
      all: async () => {
        guard()
        const results = [...state.names.entries()]
          .map(([name, row]) => ({ name, ...row }))
          .sort((a, b) => b.last_tagged_at - a.last_tagged_at)
          .slice(0, args[0])
        return { results }
      },
    })
    return { ...exec([]), bind: (...args) => exec(args) }
  })
  return { prepare, state }
}

const call = (method, env) =>
  worker.fetch(new Request(ENDPOINT, { method }), env)

vi.spyOn(console, 'error').mockImplementation(() => {})

describe('/api/scaduscope/tags', () => {
  it('reports zero before anyone has tagged a shadowman', async () => {
    const res = await call('GET', { DB: fakeDb() })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ tags: 0, points: 0 })
  })

  it('counts each POST as exactly one tag and returns the new total', async () => {
    const env = { DB: fakeDb() }
    await call('POST', env)
    const res = await call('POST', env)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.total.tags).toBe(2)
  })

  it('names the tagged shadowman and records the name forever', async () => {
    const env = { DB: fakeDb() }
    const body = await (await call('POST', env)).json()
    expect(typeof body.name).toBe('string')
    expect(body.name.length).toBeGreaterThan(3)
    expect(body.timesTagged).toBe(1)
    expect(env.DB.state.names.get(body.name)).toMatchObject({ tags: 1 })
  })

  it('counts up when a name comes around again', async () => {
    const env = { DB: fakeDb() }
    env.DB.state.names.set('Mother Ostend', { tags: 13 })
    // Force the generator onto "Mother Ostend": pattern 0.5 → Title + Place.
    const spy = vi
      .spyOn(crypto, 'getRandomValues')
      .mockImplementation((buf) => {
        const seq = [0.5, TITLES.indexOf('Mother') / TITLES.length + 1e-6]
        seq.push(SHORT_PLACES.indexOf('Ostend') / SHORT_PLACES.length + 1e-6)
        buf[0] = Math.floor(seq[spy.mock.calls.length - 1] * 2 ** 32)
        return buf
      })
    const body = await (await call('POST', env)).json()
    spy.mockRestore()
    expect(body.name).toBe('Mother Ostend')
    expect(body.timesTagged).toBe(14)
  })

  it('refuses other methods', async () => {
    const res = await call('DELETE', { DB: fakeDb() })
    expect(res.status).toBe(405)
  })

  it('reports an outage instead of a fake total', async () => {
    const env = { DB: fakeDb({ fail: true }) }
    expect((await call('GET', env)).status).toBe(500)
    expect((await call('POST', env)).status).toBe(500)
  })
})

describe('tag points', () => {
  // America/Chicago is UTC-5 in September (CDT).
  it('doubles during the witching hour in Bull Valley, by the real clock', () => {
    expect(tagPoints(new Date('2026-09-26T07:59:00Z'))).toBe(1) // 02:59
    expect(tagPoints(new Date('2026-09-26T08:00:00Z'))).toBe(2) // 03:00
    expect(tagPoints(new Date('2026-09-26T08:59:00Z'))).toBe(2) // 03:59
    expect(tagPoints(new Date('2026-09-26T09:00:00Z'))).toBe(1) // 04:00
  })
})

describe('shadowman names', () => {
  // Deterministic source for exploring the whole grammar.
  const seeded = (seed) => () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32
    return seed / 2 ** 32
  }

  it('only ever builds names from the curated lists', () => {
    const words = new Set(
      [...PLACES, ...SHORT_PLACES, ...TITLES, ...NOUNS, ...EPITHETS, ...GIVEN]
        .join(' ')
        .split(' ')
        .concat(['The', 'of'])
    )
    const rand = seeded(7)
    for (let i = 0; i < 2000; i++) {
      for (const word of generateName(rand).split(' ')) {
        expect(words.has(word)).toBe(true)
      }
    }
  })

  it('uses all three folklore patterns', () => {
    const rand = seeded(42)
    const names = Array.from({ length: 500 }, () => generateName(rand))
    expect(names.some((n) => n.startsWith('The '))).toBe(true)
    expect(names.some((n) => n.includes(' of '))).toBe(true)
    expect(names.some((n) => TITLES.some((t) => n.startsWith(`${t} `)))).toBe(
      true
    )
  })

  it('keeps the name space finite so names recur', () => {
    expect(NAME_SPACE).toBe(3542)
  })
})

describe('/api/scaduscope/names', () => {
  const NAMES = 'https://forgotten-industries.net/api/scaduscope/names'
  const get = (env, method = 'GET') =>
    worker.fetch(new Request(NAMES, { method }), env)

  it('lists the most recently tagged names, newest first, capped at 20', async () => {
    const env = { DB: fakeDb() }
    for (let i = 0; i < 25; i++) {
      env.DB.state.names.set(`Name ${i}`, {
        tags: i + 1,
        last_tagged_at: 1000 + i,
      })
    }
    const res = await get(env)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.names).toHaveLength(20)
    expect(body.names[0]).toEqual({
      name: 'Name 24',
      tags: 25,
      lastTaggedAt: 1024,
    })
    expect(body.names[19].name).toBe('Name 5')
  })

  it('includes a name the moment it is tagged', async () => {
    const env = { DB: fakeDb() }
    const tagged = await (await call('POST', env)).json()
    const { names } = await (await get(env)).json()
    expect(names[0].name).toBe(tagged.name)
  })

  it('never exposes anything about who tagged', async () => {
    const env = { DB: fakeDb() }
    await call('POST', env)
    const { names } = await (await get(env)).json()
    expect(Object.keys(names[0]).sort()).toEqual([
      'lastTaggedAt',
      'name',
      'tags',
    ])
  })

  it('is read-only and reports outages', async () => {
    expect((await get({ DB: fakeDb() }, 'POST')).status).toBe(405)
    expect((await get({ DB: fakeDb({ fail: true }) })).status).toBe(500)
  })
})
