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
    expect(existsSite('field-logs/voice/index.html')).toBe(true)
    expect(
      existsSite('archive/objects/caselabs-mercury-s8-chassis/index.html')
    ).toBe(true)
    expect(
      existsSite('archive/objects/aquaero-6-xt-controller/index.html')
    ).toBe(true)
    expect(
      existsSite('archive/objects/ek-radiators-loop-inventory/index.html')
    ).toBe(true)
    expect(
      existsSite('archive/objects/peregrine-drone-damage-log/index.html')
    ).toBe(true)
    expect(
      existsSite('archive/objects/olympus-recorder-field-audio-kit/index.html')
    ).toBe(true)
  })

  it('renders the photo archive prototype schema and listing', () => {
    const listing = readSite('archive/objects/index.html')
    const chassis = readSite(
      'archive/objects/caselabs-mercury-s8-chassis/index.html'
    )

    expect(listing).toContain('5 prototype records')
    expect(listing).toContain('/archive/objects/aquaero-6-xt-controller/')
    expect(listing).toContain('/archive/objects/peregrine-drone-damage-log/')
    expect(chassis).toContain('CaseLabs Mercury S8 chassis')
    expect(chassis).toContain('Wichita Branch / garage archive')
    expect(chassis).toContain('FI-PROJ-001')
    expect(chassis).toContain('Mercury S8 chassis intake reference.')
    expect(chassis).toContain(
      'Chassis exterior and panel configuration before cleaning.'
    )
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
    expect(fieldLog.signature).toContain('Forgotten Industries // ATLAS Report')
    expect(
      index.documents.filter((record) => record.type === 'archive-object')
    ).toHaveLength(5)
    expect(
      index.documents.find(
        (record) => record.id === 'archive-object:aquaero-6-xt-controller'
      )
    ).toMatchObject({
      category: 'controller',
      object: 'Aqua Computer Aquaero 6 XT',
      associated_project: 'FI-PROJ-001',
      url: '/archive/objects/aquaero-6-xt-controller/',
    })
  })

  it('renders system and content-level AI provenance citations', () => {
    const archive = JSON.parse(
      fs.readFileSync(path.join(DIST, 'forgotten-industries.json'), 'utf8')
    )
    const home = readSite('index.html')
    const report = readSite('field-logs/playonline-senses-weakness/index.html')
    const entry = readSite(
      'posts/2026-06-06-prelude-a-thing-documented-is-a-thing-not-yet-lost.html'
    )

    expect(archive.atlasReportProvenance).toMatchObject({
      human_authority: 'Matthew Taylor Marx',
      operating_layer: 'ATLAS',
      editorial_system: 'OpenAI ChatGPT',
      implementation_system: 'OpenAI Codex',
    })
    expect(home).toContain('Site AI provenance footnote')
    expect(report).toContain('AI-generated synthesis with human direction')
    expect(report).toContain('generated with ATLAS through OpenAI ChatGPT')
    expect(entry).toContain('AI-assisted editorial collaboration')
  })

  it('does not emit duplicate canonical URLs for built HTML pages', () => {
    const htmlFiles = []

    function walk(directory) {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const fullPath = path.join(directory, entry.name)
        if (entry.isDirectory()) {
          if (fullPath.startsWith(path.join(SITE, 'site-snapshots'))) continue
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
