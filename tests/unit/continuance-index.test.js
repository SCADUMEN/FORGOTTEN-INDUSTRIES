import { describe, expect, it } from 'vitest'
import { normalizeFiDocuments } from '../../scripts/build_continuance_index.cjs'
import {
  tokenize,
  scorePair,
  relatedRecords,
} from '../../continuance/src/lib/crossref.js'

describe('normalizeFiDocuments', () => {
  it('maps a search-index document to the Record shape', () => {
    const [record] = normalizeFiDocuments([
      {
        id: 'FI-DSR-003',
        type: 'project',
        title: 'Modular Cartridge System',
        url: '/archive/projects/modular/',
        date: '2026',
        tags: ['archive', 'storage'],
        summary: 'A prototype dossier.',
        body: 'full body text',
        category: 'Storage',
        system: 'Display',
        status: 'v0.1',
        source: 'src/data/projects.yml',
      },
    ])

    expect(record).toMatchObject({
      id: 'project:FI-DSR-003',
      sourceId: 'fi',
      title: 'Modular Cartridge System',
      text: 'full body text',
      url: '/archive/projects/modular/',
      tags: ['archive', 'storage'],
      type: 'project',
    })
    expect(record.meta).toEqual({
      recordId: 'FI-DSR-003',
      category: 'Storage',
      system: 'Display',
      status: 'v0.1',
      source: 'src/data/projects.yml',
    })
  })

  it('produces globally unique ids even when raw ids repeat across types', () => {
    const records = normalizeFiDocuments([
      { id: '002', type: 'voice-field-log' },
      { id: '002', type: 'social-post' },
      { id: '002', type: 'social-post' },
    ])
    const ids = records.map((r) => r.id)
    expect(new Set(ids).size).toBe(3)
    // Same raw id, different type -> distinct composite; same type -> suffixed.
    expect(ids).toEqual([
      'voice-field-log:002',
      'social-post:002',
      'social-post:002#1',
    ])
    expect(records[2].meta.recordId).toBe('002')
  })

  it('falls back to object then id for the title, and tolerates missing fields', () => {
    const [byObject, byId] = normalizeFiDocuments([
      { id: 'A', object: 'Object Name' },
      { id: 'B' },
    ])
    expect(byObject.title).toBe('Object Name')
    expect(byId.title).toBe('B')
    expect(byId.tags).toEqual([])
    expect(byId.text).toBe('')
  })
})

describe('cross-reference scoring', () => {
  const anchor = {
    id: 'a1',
    title: 'Lighthouse maintenance log',
    tags: ['preservation', 'endurance'],
    summary: '',
    text: 'replacing the bulb again after many years',
  }

  it('tokenize drops stopwords and short tokens', () => {
    const tokens = tokenize('The bulb and the lighthouse')
    expect(tokens).toContain('bulb')
    expect(tokens).toContain('lighthouse')
    expect(tokens).not.toContain('the')
    expect(tokens).not.toContain('and')
  })

  it('scores shared tags higher and reports what matched', () => {
    const related = {
      id: 'b1',
      title: 'Endurance and preservation notes',
      tags: ['preservation', 'endurance'],
      summary: '',
      text: 'lighthouse bulb replacement',
    }
    const { score, sharedTags, sharedTerms } = scorePair(anchor, related)
    expect(score).toBeGreaterThan(0)
    expect(sharedTags.sort()).toEqual(['endurance', 'preservation'])
    expect(sharedTerms).toContain('lighthouse')
  })

  it('relatedRecords excludes the anchor itself and drops zero-overlap records', () => {
    const targets = [
      anchor, // same id - must be excluded
      {
        id: 'b1',
        title: 'Bulb archive',
        tags: ['preservation'],
        text: 'lighthouse',
      },
      {
        id: 'b2',
        title: 'Unrelated recipe',
        tags: ['cooking'],
        text: 'onions garlic',
      },
    ]
    const results = relatedRecords(anchor, targets)
    const ids = results.map((r) => r.record.id)
    expect(ids).toContain('b1')
    expect(ids).not.toContain('a1')
    expect(ids).not.toContain('b2')
  })
})
