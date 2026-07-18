#!/usr/bin/env node

'use strict'

const fs = require('fs')
const path = require('path')
const { exiftool } = require('exiftool-vendored')

const root = path.resolve(__dirname, '..')

// Raster image types that can carry an embedded GPS location. SVG is XML and is
// covered by the public-surface text audit instead.
const imageExtensions = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.heic',
  '.heif',
  '.tif',
  '.tiff',
  '.webp',
])

// exiftool arguments that clear location metadata only. GPS holds the EXIF GPS
// IFD (where phones write coordinates); the XMP geotag block is cleared too.
// Camera model, timestamps, and other descriptive EXIF are left intact.
const locationStripArgs = ['-gps:all=', '-xmp:geotag=', '-overwrite_original']

// Default scrub targets: raw intake and the published asset source. Both live in
// the public repository, so both must stay location-clean.
const defaultTargets = ['intake', 'src/assets']

function log(message) {
  process.stdout.write(`[exif:scrub] ${message}\n`)
}

function walk(directory) {
  if (!fs.existsSync(directory)) return []
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name)
    return entry.isDirectory() ? walk(absolute) : [absolute]
  })
}

function isImage(file) {
  return imageExtensions.has(path.extname(file).toLowerCase())
}

async function hasLocation(file) {
  const tags = await exiftool.read(file)
  return Object.keys(tags).some((key) => /^GPS/.test(key))
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const requested = args.filter((arg) => !arg.startsWith('--'))
  const targets = requested.length ? requested : defaultTargets
  const dirs = targets.map((dir) =>
    path.isAbsolute(dir) ? dir : path.join(root, dir)
  )

  const files = dirs.flatMap(walk).filter(isImage)
  const scope = dirs.map((dir) => path.relative(root, dir) || dir).join(', ')
  log(
    `${dryRun ? 'checking' : 'scrubbing'} ${files.length} image(s) across: ${scope}`
  )

  let located = 0
  let scrubbed = 0
  for (const file of files) {
    const relative = path.relative(root, file)
    if (!(await hasLocation(file))) continue
    located += 1
    if (dryRun) {
      log(`has location: ${relative}`)
      continue
    }
    await exiftool.write(file, {}, { writeArgs: locationStripArgs })
    scrubbed += 1
    log(`stripped location: ${relative}`)
  }

  if (dryRun) {
    log(`done (dry run): ${located} of ${files.length} image(s) carry location`)
  } else {
    log(`done: stripped location from ${scrubbed} of ${files.length} image(s)`)
  }
}

if (require.main === module) {
  main()
    .then(() => exiftool.end())
    .catch(async (err) => {
      process.stderr.write(`[exif:scrub] fatal: ${err.stack || err}\n`)
      await exiftool.end().catch(() => {})
      process.exit(1)
    })
}

module.exports = { walk, isImage, hasLocation, locationStripArgs }
