#!/usr/bin/env node

'use strict'

const fs = require('fs')
const path = require('path')
const { exiftool } = require('exiftool-vendored')
const {
  findLocationTags,
  isMedia,
  locationStripArgs,
} = require('./location_metadata.cjs')

const root = path.resolve(__dirname, '..')

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

async function readLocationTags(file) {
  const tags = await exiftool.readRaw(file)
  return findLocationTags(tags)
}

async function hasLocation(file) {
  return (await readLocationTags(file)).length > 0
}

async function scrubLocation(file) {
  await exiftool.write(file, {}, { writeArgs: locationStripArgs })
  const remaining = await readLocationTags(file)
  if (remaining.length > 0) {
    throw new Error(
      `Location metadata remains after scrub: ${remaining.join(', ')}`
    )
  }
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const requested = args.filter((arg) => !arg.startsWith('--'))
  const targets = requested.length ? requested : defaultTargets
  const dirs = targets.map((dir) =>
    path.isAbsolute(dir) ? dir : path.join(root, dir)
  )

  const files = dirs.flatMap(walk).filter(isMedia)
  const scope = dirs.map((dir) => path.relative(root, dir) || dir).join(', ')
  log(
    `${dryRun ? 'checking' : 'scrubbing'} ${files.length} media file(s) across: ${scope}`
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
    await scrubLocation(file)
    scrubbed += 1
    log(`stripped location: ${relative}`)
  }

  if (dryRun) {
    log(
      `done (dry run): ${located} of ${files.length} media file(s) carry location`
    )
  } else {
    log(
      `done: stripped location from ${scrubbed} of ${files.length} media file(s)`
    )
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

module.exports = {
  hasLocation,
  isMedia,
  locationStripArgs,
  readLocationTags,
  scrubLocation,
  walk,
}
