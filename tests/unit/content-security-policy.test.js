import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..'
)
const SITE = path.join(ROOT, '_site')

const JS_TYPE = /^(text\/javascript|application\/javascript|module)$/i

function htmlFiles(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) htmlFiles(full, acc)
    else if (entry.name.endsWith('.html')) acc.push(full)
  }
  return acc
}

// Mirrors scripts/build_csp.cjs: a <script> with a non-JavaScript type is a
// data block the browser never executes, so CSP does not govern it.
function executableInlineScripts(html) {
  const found = []
  const pattern = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi
  for (const match of html.matchAll(pattern)) {
    const typeMatch = (match[1] || '').match(/type\s*=\s*["']([^"']+)["']/i)
    if (typeMatch && !JS_TYPE.test(typeMatch[1].trim())) continue
    found.push(match[2])
  }
  return found
}

const policy = (() => {
  const headers = fs.readFileSync(path.join(SITE, '_headers'), 'utf8')
  const match = headers.match(/Content-Security-Policy: ([^\n]+)/)
  return match ? match[1] : ''
})()

describe('content security policy', () => {
  it('is published in _headers', () => {
    expect(policy).not.toBe('')
    expect(policy).toContain("default-src 'self'")
    expect(policy).toContain("object-src 'none'")
    expect(policy).toContain("base-uri 'self'")
  })

  it('covers every executable inline script with a hash', () => {
    const uncovered = []
    for (const file of htmlFiles(SITE)) {
      const html = fs.readFileSync(file, 'utf8')
      for (const body of executableInlineScripts(html)) {
        const digest = crypto
          .createHash('sha256')
          .update(body, 'utf8')
          .digest('base64')
        if (!policy.includes(`'sha256-${digest}'`)) {
          uncovered.push(path.relative(SITE, file))
        }
      }
    }
    expect(uncovered).toEqual([])
  })

  it('does not hash the archive’s JSON-LD provenance blocks', () => {
    // Those are data blocks, not scripts. Hashing them would bloat the header
    // by a thousand entries that protect nothing, so the count stays small.
    const hashes = policy.match(/'sha256-[^']+'/g) || []
    expect(hashes.length).toBeGreaterThan(0)
    expect(hashes.length).toBeLessThan(40)
  })

  it('allows exactly the external origins the archive depends on', () => {
    // CxR reaches nor and any pasted URL through the proxy, never directly.
    expect(policy).toContain(
      "connect-src 'self' https://cors-proxy.vaporwavemall.com"
    )
    // ZOOT streams its mixtape from Northern Information's range-serving host.
    expect(policy).toContain("media-src 'self' https://assets.the-rn.info")
    // Nothing else may be contacted.
    expect(policy).toContain("img-src 'self'")
    expect(policy).toContain("font-src 'self'")
  })

  it('keeps script-src free of unsafe-inline', () => {
    const scriptSrc = policy.match(/script-src ([^;]+)/)?.[1] ?? ''
    expect(scriptSrc).not.toContain('unsafe-inline')
    expect(scriptSrc).not.toContain('unsafe-eval')
  })
})
