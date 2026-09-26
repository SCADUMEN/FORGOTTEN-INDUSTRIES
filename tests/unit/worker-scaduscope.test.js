import { describe, expect, it, vi } from 'vitest'
import worker, { tagPoints } from '../../src/worker/index.js'

const ENDPOINT = 'https://forgotten-industries.net/api/scaduscope/tags'

// Minimal D1 stand-in holding the single totals row in memory, so the upsert
// and the read-back agree the way the real table would. `fail` makes every
// statement reject, as a D1 outage would.
function fakeDb({ fail = false } = {}) {
  const state = { row: null, writes: [] }
  const prepare = vi.fn((sql) => ({
    bind: (...args) => ({
      run: async () => {
        if (fail) throw new Error('D1 unavailable')
        state.writes.push({ sql, args })
        const [points] = args
        state.row = state.row
          ? { tags: state.row.tags + 1, points: state.row.points + points }
          : { tags: 1, points }
      },
    }),
    first: async () => {
      if (fail) throw new Error('D1 unavailable')
      return state.row
    },
  }))
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
    expect(env.DB.state.writes).toHaveLength(2)
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
