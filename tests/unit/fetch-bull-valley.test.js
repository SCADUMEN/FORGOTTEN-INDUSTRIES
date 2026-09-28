import { describe, expect, it } from 'vitest'
import fetchBullValley from '../../scripts/fetch_bull_valley.cjs'

const { isUnreachable } = fetchBullValley

const httpError = (status) =>
  Object.assign(new Error(`${status} for https://example.test`), { status })

describe('IDOT reachability', () => {
  it('treats DNS, connection, and timeout failures as an outage', () => {
    // Node's fetch on getaddrinfo ENOTFOUND, as seen on 2026-09-28.
    const dns = new TypeError('fetch failed', {
      cause: Object.assign(new Error('getaddrinfo ENOTFOUND'), {
        code: 'ENOTFOUND',
      }),
    })
    expect(isUnreachable(dns)).toBe(true)
    expect(isUnreachable(new DOMException('timed out', 'TimeoutError'))).toBe(
      true
    )
  })

  it('treats 5xx and 429 as an outage', () => {
    expect(isUnreachable(httpError(503))).toBe(true)
    expect(isUnreachable(httpError(504))).toBe(true)
    expect(isUnreachable(httpError(429))).toBe(true)
  })

  it('still fails on replies that are wrong rather than missing', () => {
    expect(isUnreachable(httpError(400))).toBe(false)
    expect(isUnreachable(httpError(404))).toBe(false)
    expect(isUnreachable(new Error('IDOT result was truncated'))).toBe(false)
    expect(isUnreachable(new TypeError('x is not a function'))).toBe(false)
    expect(isUnreachable(undefined)).toBe(false)
  })
})
