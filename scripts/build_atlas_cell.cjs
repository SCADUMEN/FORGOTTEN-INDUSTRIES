#!/usr/bin/env node
'use strict'

// Extract the authored display frame from the preserved ATLAS sprite sheet.
//
// The sheet under src/assets/atlas/ is a byte-identical copy of the installed
// ATLAS v2 pet source and must stay that way — its SHA-256 is published in the
// dossier. Pages only ever show its first 192x208 cell, so this script writes
// that cell out as a lossless derivative instead. Lossless keeps the displayed
// pixels identical to the source frame, which is the whole point: the archive
// gets a small asset without the record acquiring a re-encode it cannot vouch
// for.
//
// Usage: node scripts/build_atlas_cell.cjs [--check]
//   --check verifies the committed derivative matches a fresh extraction and
//           exits non-zero if it has drifted, without writing.

const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const sharp = require('sharp')

const ATLAS_DIR = path.join(__dirname, '..', 'src', 'assets', 'atlas')
const SOURCE = path.join(ATLAS_DIR, 'atlas-archive-docent-spritesheet.webp')
const DERIVATIVE = path.join(ATLAS_DIR, 'atlas-archive-docent-cell-01.webp')

// The preserved sheet is an 8 x 11 grid of 192 x 208 cells.
const CELL = { left: 0, top: 0, width: 192, height: 208 }
const SOURCE_SHA256 =
  '8497f764eab890f3a91b12b54417c38e14a4a998d44d0af6e30f29623ebd66bc'

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

async function main() {
  const check = process.argv.includes('--check')

  const source = fs.readFileSync(SOURCE)
  const sourceHash = sha256(source)
  if (sourceHash !== SOURCE_SHA256) {
    console.error(
      `Preserved sheet no longer matches its published SHA-256.\n` +
        `  expected ${SOURCE_SHA256}\n  actual   ${sourceHash}\n` +
        `Refusing to derive a display frame from an altered source.`
    )
    process.exitCode = 1
    return
  }

  const cell = await sharp(source)
    .extract(CELL)
    .webp({ lossless: true })
    .toBuffer()

  if (check) {
    if (!fs.existsSync(DERIVATIVE)) {
      console.error('Derivative missing. Run without --check to write it.')
      process.exitCode = 1
      return
    }
    const committed = fs.readFileSync(DERIVATIVE)
    if (sha256(committed) !== sha256(cell)) {
      console.error(
        'Committed derivative does not match a fresh extraction from the sheet.'
      )
      process.exitCode = 1
      return
    }
    console.log(`Atlas display cell verified: ${sha256(cell)}`)
    return
  }

  fs.writeFileSync(DERIVATIVE, cell)
  console.log(
    `Wrote ${path.relative(process.cwd(), DERIVATIVE)} ` +
      `(${CELL.width}x${CELL.height}, ${(cell.length / 1024).toFixed(1)} KB)\n` +
      `  SHA-256: ${sha256(cell)}`
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
