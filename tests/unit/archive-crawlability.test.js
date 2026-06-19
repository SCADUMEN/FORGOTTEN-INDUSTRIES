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
const DIST = path.join(ROOT, 'dist')

function readSite(relativePath) {
  return fs.readFileSync(path.join(SITE, relativePath), 'utf8')
}

function existsSite(relativePath) {
  return fs.existsSync(path.join(SITE, relativePath))
}

function hrefs(html) {
  return [...html.matchAll(/<a\s+[^>]*href="([^"]+)"/g)].map(
    (match) => match[1]
  )
}

function canonical(html) {
  return html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/)?.[1]
}

describe('archive crawlability output', () => {
  it('generates object, project, and taxonomy index pages', () => {
    expect(existsSite('archive/objects/index.html')).toBe(true)
    expect(existsSite('archive/taxonomy/index.html')).toBe(true)
    expect(existsSite('archive/categories/index.html')).toBe(true)
    expect(existsSite('archive/tags/index.html')).toBe(true)
    expect(existsSite('archive/status/index.html')).toBe(true)
    expect(existsSite('archive/systems/index.html')).toBe(true)
    expect(
      existsSite(
        'archive/projects/caselabs-mercury-s8-pedestal-restoration/index.html'
      )
    ).toBe(true)
    expect(existsSite('archive/objects/fi-case-001/index.html')).toBe(true)
  })

  it('exposes archive browse routes as plain HTML links', () => {
    const archiveLinks = hrefs(readSite('archive.html'))
    const inventoryLinks = hrefs(readSite('archive/inventory/index.html'))
    const projectLinks = hrefs(readSite('archive/projects/index.html'))

    expect(archiveLinks).toContain('/archive/objects/')
    expect(archiveLinks).toContain('/archive/taxonomy/')
    expect(archiveLinks).toContain(
      '/archive/projects/caselabs-mercury-s8-pedestal-restoration/'
    )
    expect(inventoryLinks).toContain('/archive/objects/fi-case-001/')
    expect(projectLinks).toContain('/archive/objects/')
    expect(projectLinks).toContain('/archive/systems/')
    expect(projectLinks).toContain('/archive/status/')
  })

  it('adds taxonomy fields to the generated search index', () => {
    const index = JSON.parse(
      fs.readFileSync(path.join(DIST, 'search-index.json'), 'utf8')
    )
    const caseRecord = index.documents.find(
      (record) => record.id === 'FI-CASE-001'
    )
    const fieldLog = index.documents.find(
      (record) => record.id === 'FI-LOG-001'
    )

    expect(caseRecord).toMatchObject({
      url: '/archive/objects/fi-case-001/',
      object: 'CaseLabs Mercury S8',
      associated_project: 'FI-PROJ-001',
      condition: 'stored / needs inspection and cleaning',
    })
    expect(fieldLog).toMatchObject({
      object: 'CaseLabs Mercury S8 + pedestal',
      system: 'custom watercooling restoration',
      associated_project: 'FI-PROJ-001',
    })
    expect(fieldLog.signature).toContain('Forgotten Industries // Field Log')
  })

  it('does not emit duplicate canonical URLs for built HTML pages', () => {
    const htmlFiles = []

    function walk(directory) {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const fullPath = path.join(directory, entry.name)
        if (entry.isDirectory()) {
          walk(fullPath)
        } else if (entry.name.endsWith('.html')) {
          htmlFiles.push(fullPath)
        }
      }
    }

    walk(SITE)

    const canonicals = htmlFiles
      .map((filePath) => canonical(fs.readFileSync(filePath, 'utf8')))
      .filter(Boolean)
    const duplicates = canonicals.filter(
      (url, index) => canonicals.indexOf(url) !== index
    )

    expect(duplicates).toEqual([])
  })
})
