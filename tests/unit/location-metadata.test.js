import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { exiftool } from 'exiftool-vendored'
import { afterAll, describe, expect, it } from 'vitest'
import scrubber from '../../scripts/scrub_exif.cjs'

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..'
)
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), 'fi-location-metadata-'))

function scratchCopy(source, name) {
  const destination = path.join(SCRATCH, name)
  fs.copyFileSync(path.join(ROOT, source), destination)
  return destination
}

async function writeMetadata(file, writeArgs) {
  await exiftool.write(
    file,
    {},
    {
      writeArgs: [...writeArgs, '-overwrite_original'],
    }
  )
}

afterAll(async () => {
  await exiftool.end()
  fs.rmSync(SCRATCH, { force: true, recursive: true })
})

describe('location metadata guard', () => {
  it('keeps the audit inside the canonical site build', () => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')
    )

    expect(packageJson.scripts['build:site']).toContain('npm run audit:public')
  })

  it('detects and removes structured XMP coordinates from a JPEG', async () => {
    const file = scratchCopy(
      'src/assets/forgotten-industries.jpeg',
      'structured-xmp.jpg'
    )
    await writeMetadata(file, [
      '-XMP-iptcExt:LocationCreatedGPSLatitude=41.40338',
      '-XMP-iptcExt:LocationCreatedGPSLongitude=2.17403',
      '-XMP-iptcExt:LocationShownGPSLatitude=41.40338',
      '-XMP-iptcExt:LocationShownGPSLongitude=2.17403',
    ])

    expect(await scrubber.readLocationTags(file)).toEqual(
      expect.arrayContaining([
        'LocationCreatedGPSLatitude',
        'LocationCreatedGPSLongitude',
        'LocationShownGPSLatitude',
        'LocationShownGPSLongitude',
      ])
    )

    await scrubber.scrubLocation(file)

    expect(await scrubber.readLocationTags(file)).toEqual([])
  })

  it('detects and removes QuickTime coordinates from a MOV', async () => {
    const file = scratchCopy(
      'src/assets/initial-photos/matthewmarx-071.mov',
      'quicktime.mov'
    )
    await writeMetadata(file, [
      '-Keys:GPSCoordinates=+41.40338+002.17403+000.000/',
    ])

    expect(scrubber.isMedia(file)).toBe(true)
    expect(await scrubber.readLocationTags(file)).toContain('GPSCoordinates')

    await scrubber.scrubLocation(file)

    expect(await scrubber.readLocationTags(file)).toEqual([])
  })
})
