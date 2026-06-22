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
  return html.match(/<link\s+[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1]
}

describe('archive crawlability output', () => {
  it('generates object, dossier, and taxonomy index pages', () => {
    expect(existsSite('l-archive/index.html')).toBe(true)
    expect(existsSite('archive/index.html')).toBe(true)
    expect(existsSite('archive.html')).toBe(true)
    expect(existsSite('inventory/index.html')).toBe(true)
    expect(existsSite('inventory.html')).toBe(true)
    expect(existsSite('archive/inventory/index.html')).toBe(true)
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
      existsSite('hang-on-to-each-other/wrist-field-instruments/index.html')
    ).toBe(true)
    expect(
      existsSite('field-logs/accumulation-across-active-fronts/index.html')
    ).toBe(true)
  })

  it('exposes archive browse routes as plain HTML links', () => {
    const archiveLinks = hrefs(readSite('l-archive/index.html'))
    const legacyArchiveLinks = hrefs(readSite('archive/index.html'))
    const inventoryLinks = hrefs(readSite('archive/inventory/index.html'))
    const dossierLinks = hrefs(readSite('archive/projects/index.html'))

    expect(legacyArchiveLinks).toContain('/l-archive/')
    expect(archiveLinks).toContain('/archive/inventory/')
    expect(archiveLinks).toContain('/archive/objects/')
    expect(archiveLinks).toContain('/archive/taxonomy/')
    expect(archiveLinks).toContain('/oeuvre/#dossiers')
    expect(inventoryLinks).toContain('/archive/objects/fi-case-001/')
    expect(dossierLinks).toContain(
      '/archive/projects/caselabs-mercury-s8-pedestal-restoration/'
    )
    expect(dossierLinks).toContain('/archive/objects/')
    expect(dossierLinks).toContain('/archive/systems/')
    expect(dossierLinks).toContain('/archive/status/')
  })

  it('publishes Manual 002 and its preserved source asset', () => {
    const manualShelf = readSite('hang-on-to-each-other/index.html')
    const manual = readSite(
      'hang-on-to-each-other/wrist-field-instruments/index.html'
    )

    expect(manualShelf).toContain(
      '/hang-on-to-each-other/wrist-field-instruments/'
    )
    expect(canonical(manual)).toBe(
      'https://forgotten-industries.net/hang-on-to-each-other/wrist-field-instruments/'
    )
    expect(manual).toContain('LE MANUEL 002')
    expect(manual).toContain('Wrist &amp; Field Instruments')
    expect(manual).toContain('01 / Case Architecture')
    expect(manual).toContain('FI-WATCH-001')
    expect(manual).toContain(
      "D'en haut, les choses se souviennent les unes des autres."
    )
    expect(
      existsSite(
        'assets/reference/hang-on-to-each-other/wrist-field-instruments/Wrist_Field_Instruments_Manual_002_ForgottenIndustries.pdf'
      )
    ).toBe(true)
  })

  it('routes legacy inventory doors to the generated inventory shelf', () => {
    const redirects = fs.readFileSync(path.join(SITE, '_redirects'), 'utf8')
    expect(redirects).toContain('/inventory /archive/inventory/ 301')
    expect(redirects).toContain('/inventory/ /archive/inventory/ 301')
    expect(redirects).toContain('/inventory.html /archive/inventory/ 301')

    const inventoryRoute = readSite('inventory/index.html')
    const inventoryHtml = readSite('inventory.html')
    const generatedInventory = readSite('archive/inventory/index.html')

    expect(canonical(inventoryRoute)).toBe(
      'https://forgotten-industries.net/archive/inventory/'
    )
    expect(canonical(inventoryHtml)).toBe(
      'https://forgotten-industries.net/archive/inventory/'
    )
    expect(inventoryRoute).toContain('href="/archive/inventory/"')
    expect(inventoryHtml).toContain('href="/archive/inventory/"')
    expect(inventoryHtml).not.toContain('<h2>Core Items</h2>')
    expect(generatedInventory).toContain('FI-CL-PART-010')
    expect(generatedInventory).toContain('/archive/objects/fi-cl-part-010/')
  })

  it('documents archive compatibility routes without redirect loops', () => {
    const redirects = fs.readFileSync(path.join(SITE, '_redirects'), 'utf8')
    expect(redirects).toContain('/archive /l-archive/ 301')
    expect(redirects).toContain('/archive/ /l-archive/ 301')
    expect(redirects).toContain('/archive.html /l-archive/ 301')
    expect(redirects).not.toMatch(/\/l-archive\/\s+\/archive\/?\s+301/)

    const archiveHtml = readSite('archive.html')
    const archiveIndex = readSite('archive/index.html')
    expect(canonical(archiveHtml)).toBe(
      'https://forgotten-industries.net/l-archive/'
    )
    expect(canonical(archiveIndex)).toBe(
      'https://forgotten-industries.net/l-archive/'
    )
    expect(archiveHtml).toContain('href="/l-archive/"')
    expect(archiveIndex).toContain('href="/l-archive/"')
    expect(archiveHtml).not.toContain(
      'The preserved record now lives at /archive/'
    )
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
    const dailySummary = index.documents.find(
      (record) => record.id === 'FI-LOG-008'
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
    expect(dailySummary).toMatchObject({
      title: 'ATLAS Report 2026.06.20 — Accumulation Across Active Fronts',
      url: '/field-logs/accumulation-across-active-fronts/',
      category: 'atlas-report',
      associated_project: 'FI-PROJ-006',
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
    expect(home).toContain('Human Judgment')
    expect(home).toContain('href="/provenance/"')
    expect(home).toContain('Build Checks')
    expect(home).toMatch(/Git Commits?/)
    expect(home).not.toContain('Source Files')
    expect(home).not.toContain('>Social Evidence<')
    expect(report).toContain('AI-generated synthesis with human direction')
    expect(report).toContain('generated with ATLAS through OpenAI ChatGPT')
    expect(entry).toContain('AI-assisted editorial collaboration')
  })

  it('renders object records as image-first entries with object social images', () => {
    const photographed = readSite('archive/objects/fi-case-001/index.html')
    const unphotographed = readSite('archive/objects/fi-ped-001/index.html')

    expect(photographed).toContain('class="object-primary-figure"')
    expect(photographed).toContain('class="object-thumbnail-strip"')
    expect(photographed).toContain('class="object-metadata-grid"')
    expect(photographed).toContain(
      '<summary id="object-source-assets-heading">'
    )
    expect(photographed).toContain(
      '<meta property="og:image" content="https://forgotten-industries.net/assets/initial-photos/matthewmarx-046.jpeg">'
    )
    expect(unphotographed).toContain('No image available')
    expect(unphotographed).toContain(
      '<meta property="og:image" content="https://forgotten-industries.net/assets/forgotten-industries.jpeg">'
    )
  })

  it('keeps the maker plate on generated record page types', () => {
    const generatedPages = [
      'archive/objects/fi-case-001/index.html',
      'archive/projects/caselabs-mercury-s8-pedestal-restoration/index.html',
      'field-logs/rebuilding-and-archiving-a-caselabs-mercury-s8-time-capsule/index.html',
      'posts/2026-06-06-prelude-a-thing-documented-is-a-thing-not-yet-lost.html',
    ]

    for (const pagePath of generatedPages) {
      const html = readSite(pagePath)
      expect(html).toContain('class="site-footer"')
      expect(html).toContain('href="/provenance/"')
      expect(html).toContain('class="fi-provenance-plate"')
      expect(html).toContain(
        'aria-label="Human Judgment Machine Collaboration provenance stamp"'
      )
      expect(html).toContain('GMT')
      expect(html).toMatch(/\/\/[\s\S]*Provenance[\s\S]*\/\/\/\//)
      expect(html).toMatch(/\d{4}\.\d{2}\.\d{2}/)
      expect(html).toMatch(/\d{2}:\d{2}/)
    }
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

    const compatibilityRoutes = new Set([
      path.join(SITE, 'archive/index.html'),
      path.join(SITE, 'archive.html'),
      path.join(SITE, 'inventory/index.html'),
      path.join(SITE, 'inventory.html'),
      path.join(SITE, 'field-logs/voice/index.html'),
    ])
    const canonicals = htmlFiles
      .filter((filePath) => !compatibilityRoutes.has(filePath))
      .map((filePath) => canonical(fs.readFileSync(filePath, 'utf8')))
      .filter(Boolean)
    const duplicates = canonicals.filter(
      (url, index) => canonicals.indexOf(url) !== index
    )

    expect(duplicates).toEqual([])
  })
})
