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

function readSite(relativePath) {
  return fs.readFileSync(path.join(SITE, relativePath), 'utf8')
}

describe('restricted Phase 2 briefing', () => {
  const protectedPhrases = [
    'Boutique Systems Division',
    'Multi-Vertical Services Launch',
    'Gun cleaning/maintenance',
    'K.S.A. 75-7b',
  ]

  it('publishes an encrypted payload behind a no-index gate', () => {
    const page = readSite('restricted/phase-2-briefing/index.html')
    const rawPayload = readSite('assets/restricted/phase-2-briefing.json')
    const client = readSite('assets/js/restricted-briefing.js')
    const payload = JSON.parse(rawPayload)

    expect(page).toContain(
      '<meta name="robots" content="noindex, nofollow, noarchive, nosnippet">'
    )
    expect(page).toContain('id="restricted-access-form"')
    expect(page).not.toContain('googletagmanager.com')
    expect(page).not.toContain('fonts.googleapis.com')
    expect(page).not.toContain('fonts.gstatic.com')
    expect(page).toContain('<meta name="referrer" content="no-referrer">')
    expect(page).toContain('http-equiv="Content-Security-Policy"')
    expect(page).toContain('default-src &#39;none&#39;')
    expect(client).toContain('new DOMParser()')
    expect(client).toContain('Restricted briefing refuses framed execution.')
    expect(client).not.toContain('content.innerHTML = plaintext')
    expect(payload).toMatchObject({
      version: 1,
      algorithm: 'AES-GCM',
      kdf: 'PBKDF2',
      digest: 'SHA-256',
      iterations: 600000,
    })
    expect(payload.salt.length).toBeGreaterThan(20)
    expect(payload.iv.length).toBeGreaterThan(12)
    expect(payload.ciphertext.length).toBeGreaterThan(30000)

    for (const phrase of protectedPhrases) {
      expect(page).not.toContain(phrase)
      expect(rawPayload).not.toContain(phrase)
    }
  })

  it('keeps the restricted route out of public discovery surfaces', () => {
    const sitemap = readSite('sitemap.xml')
    const robots = readSite('robots.txt')

    expect(sitemap).not.toContain('/restricted/')
    expect(robots).toContain('Disallow: /restricted/')
  })
})
