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
const ASSET_ROUTE = 'assets/atlas/atlas-archive-docent-spritesheet.webp'
const TEXT_EXTENSIONS = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.md',
  '.svg',
  '.ts',
  '.txt',
  '.webmanifest',
  '.xml',
  '.yaml',
  '.yml',
])
const WORKSTATION_PATH =
  /\/Users\/|\/private\/tmp(?:\/|\b)|\/Volumes\/|~\/(?:Documents|Desktop|Downloads)(?:\/|\b)/
const EXPECTED_SHA256 =
  '8497f764eab890f3a91b12b54417c38e14a4a998d44d0af6e30f29623ebd66bc'

function walkFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name)
    return entry.isDirectory() ? walkFiles(absolute) : [absolute]
  })
}

describe('Atlas gallery dossier', () => {
  const page = fs.readFileSync(
    path.join(SITE, 'projects/atlas/index.html'),
    'utf8'
  )

  it('publishes the white Shiba as Atlas, the Archive Docent', () => {
    expect(page).toContain('Atlas, the Archive Docent')
    expect(page).toContain(`src="/${ASSET_ROUTE}"`)
    expect(page).toContain('white Shiba archivist-engineer')
  })

  it('keeps the operator and evidence boundary explicit', () => {
    expect(page).toContain("does not replace Matthew's authority")
    expect(page).toContain('human review, or archive evidence')
  })

  it('publishes the preserved, expected sprite bytes', () => {
    const bytes = fs.readFileSync(path.join(SITE, ASSET_ROUTE))
    const digest = crypto.createHash('sha256').update(bytes).digest('hex')
    expect(digest).toBe(EXPECTED_SHA256)
  })

  it('does not expose a local workstation path anywhere on the public surface', () => {
    const findings = walkFiles(SITE)
      .filter((file) => TEXT_EXTENSIONS.has(path.extname(file).toLowerCase()))
      .flatMap((file) => {
        const content = fs.readFileSync(file, 'utf8')
        return WORKSTATION_PATH.test(content)
          ? [path.relative(SITE, file).split(path.sep).join('/')]
          : []
      })

    expect(findings).toEqual([])
  })
})
