import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import media from '../../scripts/lib/shadow-zone-media.cjs'

const { listShadowZoneGifs, listShadowZoneMedia, motionDerivativeFor } = media

const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), 'fi-shadow-zone-media-'))

function folder(name, files) {
  const dir = path.join(SCRATCH, name)
  for (const file of files) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true })
    fs.writeFileSync(path.join(dir, file), '')
  }
  return dir
}

afterAll(() => {
  fs.rmSync(SCRATCH, { force: true, recursive: true })
})

describe('shadow zone media manifest', () => {
  it('lists every still format and clip, sorted, with its kind', () => {
    const dir = folder('mixed', [
      'fi-eph-003-c.webp',
      'fi-eph-001-a.jpeg',
      'fi-eph-002-b.png',
      'fi-eph-004-d.mp4',
      'fi-eph-005-e.avif',
      'README.md',
      'not-an-item.jpeg',
    ])
    expect(listShadowZoneMedia(dir, '/z')).toEqual([
      { src: '/z/fi-eph-001-a.jpeg', kind: 'image' },
      { src: '/z/fi-eph-002-b.png', kind: 'image' },
      { src: '/z/fi-eph-003-c.webp', kind: 'image' },
      { src: '/z/fi-eph-004-d.mp4', kind: 'video' },
      { src: '/z/fi-eph-005-e.avif', kind: 'image' },
    ])
  })

  it('plays a GIF through its motion derivative, or falls back to the GIF as a still', () => {
    const dir = folder('gifs', [
      'fi-eph-010-loop.gif',
      'motion/fi-eph-010-loop.mp4',
      'fi-eph-011-pending.gif',
    ])
    expect(listShadowZoneMedia(dir, '/z')).toEqual([
      { src: '/z/motion/fi-eph-010-loop.mp4', kind: 'video' },
      { src: '/z/fi-eph-011-pending.gif', kind: 'image' },
    ])
    expect(listShadowZoneGifs(dir).map((file) => path.basename(file))).toEqual([
      'fi-eph-010-loop.gif',
      'fi-eph-011-pending.gif',
    ])
    expect(motionDerivativeFor(dir, 'fi-eph-010-loop.gif')).toBe(
      path.join(dir, 'motion', 'fi-eph-010-loop.mp4')
    )
  })

  it('leaves a motion item poster still out of rotation', () => {
    const dir = folder('posters', [
      'fi-eph-014-ibuprofen.gif',
      'fi-eph-014-ibuprofen-still.jpeg',
      'fi-eph-020-clip.mp4',
      'fi-eph-020-clip-still.jpeg',
      'fi-eph-030-standing-still.jpeg',
    ])
    expect(listShadowZoneMedia(dir, '/z')).toEqual([
      { src: '/z/fi-eph-014-ibuprofen.gif', kind: 'image' },
      { src: '/z/fi-eph-020-clip.mp4', kind: 'video' },
      { src: '/z/fi-eph-030-standing-still.jpeg', kind: 'image' },
    ])
  })

  it('returns an empty list for a missing folder', () => {
    expect(listShadowZoneMedia(path.join(SCRATCH, 'absent'))).toEqual([])
    expect(listShadowZoneGifs(path.join(SCRATCH, 'absent'))).toEqual([])
  })
})
