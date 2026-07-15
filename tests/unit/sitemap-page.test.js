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

describe('human-readable sitemap page', () => {
  const page = readSite('plan-du-site/index.html')

  it('is a single tree rooted at / with nested descendants', () => {
    // The root list holds exactly one node: the site root "/".
    expect(page).toContain('<a class="node-link" href="/">/</a>')
    // Nested lists prove the hierarchy descends from the root.
    expect(page).toMatch(
      /class="sitemap-tree-list is-root"[\s\S]*class="sitemap-tree-list"/
    )
  })

  it('links representative pages across the hierarchy', () => {
    for (const href of [
      '/l-archive/',
      '/oeuvre/',
      '/signal/',
      '/apropos/',
      '/docs/process/',
    ]) {
      expect(page).toContain(`href="${href}"`)
    }
  })

  it('stays in sync with the XML sitemap url set', () => {
    const xml = readSite('sitemap.xml')
    const xmlUrls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((match) => new URL(match[1]).pathname.replace(/index\.html$/, ''))
      .sort()
    const pageUrls = [...page.matchAll(/class="node-link" href="([^"]+)"/g)]
      .map((match) => match[1])
      .sort()

    expect(pageUrls).toEqual(xmlUrls)
  })

  it('never exposes the restricted route', () => {
    expect(page).not.toContain('/restricted/')
  })
})
