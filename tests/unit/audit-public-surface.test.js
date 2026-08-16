import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const { forbiddenContent } = require('../../scripts/audit_public_surface.cjs')

function labelsMatching(content) {
  return forbiddenContent
    .filter(([, pattern]) => pattern.test(content))
    .map(([label]) => label)
}

describe('audit_public_surface forbidden-content patterns', () => {
  it('does not flag a legitimate URL whose path segment reads like a workstation path', () => {
    // A real regression: this exact citation triggered a false "Linux user
    // path" finding and blocked a build, because the unanchored pattern
    // matched "/home/" inside the URL rather than a leaked local path.
    expect(labelsMatching('https://caselabs.se/home/manuals/')).toEqual([])
    expect(
      labelsMatching('See https://example.com/Users/community/ for details.')
    ).toEqual([])
    expect(labelsMatching('https://example.com/Volumes/product/')).toEqual(
      []
    )
  })

  it('still flags a genuine leaked workstation path', () => {
    expect(labelsMatching('"path": "/home/matthew/notes.md"')).toEqual([
      'Linux user path',
    ])
    expect(
      labelsMatching('Wrote output to /Users/matthew/Documents/scan.log')
    ).toEqual(['macOS user path'])
    expect(labelsMatching('Backup lives at /Volumes/Archive/vault')).toEqual([
      'mounted-volume path',
    ])
    expect(
      labelsMatching('/private/tmp/claude-501/session/scratch.json')
    ).toEqual(['temporary workstation path'])
  })

  it('still flags a local path leaked via a file:// URI', () => {
    // The character before the match is "/" here, not a hostname character,
    // so the boundary check correctly treats this as a real local path.
    expect(labelsMatching('file:///home/matthew/secrets.txt')).toEqual([
      'Linux user path',
    ])
  })
})
