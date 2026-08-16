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
// The preserved sheet stays published byte-identical and linked whole; pages
// display the extracted single-cell derivative instead of shipping 2.65 MB of
// unshown animation frames.
const ASSET_ROUTE = 'assets/atlas/atlas-archive-docent-spritesheet.webp'
const CELL_ROUTE = 'assets/atlas/atlas-archive-docent-cell-01.webp'
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
    expect(page).toContain(`src="/${CELL_ROUTE}"`)
    expect(page).toContain('white Shiba archivist-engineer')
  })

  it('displays the cell derivative rather than the whole sheet', () => {
    expect(page).not.toContain(`src="/${ASSET_ROUTE}"`)
    // The full preserved sheet stays reachable for inspection.
    expect(page).toContain(`href="/${ASSET_ROUTE}"`)
  })

  it('keeps the display cell a faithful extraction of the preserved sheet', async () => {
    const { default: sharp } = await import('sharp')

    const fromSheet = await sharp(path.join(SITE, ASSET_ROUTE))
      .extract({ left: 0, top: 0, width: 192, height: 208 })
      .raw()
      .toBuffer()
    const fromCell = await sharp(path.join(SITE, CELL_ROUTE)).raw().toBuffer()

    expect(fromCell.length).toBe(fromSheet.length)

    // Every visible pixel must match exactly. RGB under fully transparent
    // pixels is deliberately not compared: a lossless WebP encoder is free to
    // rewrite colour it is never going to draw, and it does.
    const alphaMismatches = []
    const visibleMismatches = []
    for (let offset = 0; offset < fromSheet.length; offset += 4) {
      if (fromSheet[offset + 3] !== fromCell[offset + 3]) {
        alphaMismatches.push(offset / 4)
        continue
      }
      if (fromSheet[offset + 3] === 0) continue
      if (
        fromSheet[offset] !== fromCell[offset] ||
        fromSheet[offset + 1] !== fromCell[offset + 1] ||
        fromSheet[offset + 2] !== fromCell[offset + 2]
      ) {
        visibleMismatches.push(offset / 4)
      }
    }

    expect(alphaMismatches).toEqual([])
    expect(visibleMismatches).toEqual([])
  })

  it('keeps the operator and evidence boundary explicit', () => {
    expect(page).toContain("does not replace Matthew's authority")
    expect(page).toContain('human review, or archive evidence')
    expect(page).toContain('Source material is evidence')
    expect(page).toContain("L'Opérateur authorizes consequential final actions")
  })

  it('keeps the witnesses, auditor, and registrar distinct', () => {
    expect(page).toContain('Three temporal witnesses')
    expect(page).toContain('Le Sceptique is not a fourth witness')
    expect(page).toContain('Le Taxonomiste is not a fourth witness')
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
