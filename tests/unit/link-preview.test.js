import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import objectMedia from '../../scripts/lib/object-media.cjs'

const { LINK_PREVIEW_MIN_WIDTH, linkPreviewDerivative, linkPreviewPhoto } =
  objectMedia

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..'
)
const SITE = path.join(ROOT, '_site')
const OBJECTS = path.join(SITE, 'archive', 'objects')
const ORIGIN = 'https://forgotten-industries.net/'

describe('link preview photo', () => {
  it('prefers a listed poster still over the primary photo', () => {
    expect(
      linkPreviewPhoto({
        photos: [
          'assets/ephemera/shadow-zone/fi-eph-014-ibuprofen.gif',
          'assets/ephemera/shadow-zone/fi-eph-014-ibuprofen-still.jpeg',
        ],
      })
    ).toBe('assets/ephemera/shadow-zone/fi-eph-014-ibuprofen-still.jpeg')
  })

  it('falls back to the primary still and skips private or unplayable files', () => {
    expect(
      linkPreviewPhoto({
        photos: [
          'private/original.heic',
          'assets/a/clip.mp4',
          'assets/a/b.png',
        ],
      })
    ).toBe('assets/a/b.png')
    expect(linkPreviewPhoto({ photos: ['assets/a/clip.mp4'] })).toBe('')
    expect(linkPreviewPhoto({})).toBe('')
  })

  it('mirrors the still under the previews folder as a JPEG', () => {
    expect(linkPreviewDerivative('assets/ephemera/shadow-zone/x.gif')).toBe(
      'assets/previews/ephemera/shadow-zone/x.jpeg'
    )
    expect(linkPreviewDerivative('forgotten-industries/l-archive/y.png')).toBe(
      'assets/previews/forgotten-industries/l-archive/y.jpeg'
    )
  })
})

// Messages ignores og:image files under 150px wide (Apple TN3156), so a link
// to any object page must carry a preview at least that wide.
describe('object page link previews', () => {
  it('every og:image is a shipped image at least 150px wide', async () => {
    const narrow = []
    const missing = []
    let checked = 0

    for (const slug of fs.readdirSync(OBJECTS)) {
      const page = path.join(OBJECTS, slug, 'index.html')
      if (!fs.existsSync(page)) continue
      const match = fs
        .readFileSync(page, 'utf8')
        .match(/<meta property="og:image" content="([^"]+)"/)
      if (!match || !match[1].startsWith(ORIGIN)) continue

      const file = path.join(SITE, decodeURI(match[1].slice(ORIGIN.length)))
      if (!fs.existsSync(file)) {
        missing.push(`${slug}: ${match[1]}`)
        continue
      }
      const { width } = await sharp(file).metadata()
      checked += 1
      if (width < LINK_PREVIEW_MIN_WIDTH) narrow.push(`${slug}: ${width}px`)
    }

    expect(checked).toBeGreaterThan(0)
    expect(missing).toEqual([])
    expect(narrow).toEqual([])
  })
})
