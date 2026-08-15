#!/usr/bin/env node
'use strict'

// Vendor the site's webfonts so no page depends on fonts.googleapis.com.
//
// The archive used to load four families from Google's CDN with a
// render-blocking <link>, which put a third-party DNS + TLS + request chain on
// the critical path of every page and handed a visitor log to a third party.
// This script fetches the same css2 payload a browser would, keeps only the
// latin and latin-ext subsets the archive actually sets, writes the woff2 files
// into src/assets/fonts/, and generates src/css/fonts.css with @font-face rules
// pointing at those local copies.
//
// Google serves one file for several declared weights of some families, so
// identical payloads are stored once and shared between @font-face rules.
//
// Usage: node scripts/vendor_fonts.cjs

const crypto = require('node:crypto')
const fs = require('node:fs')
const https = require('node:https')
const path = require('node:path')

const REPO = path.join(__dirname, '..')
const FONT_DIR = path.join(REPO, 'src', 'assets', 'fonts')
const CSS_OUT = path.join(REPO, 'src', 'css', 'fonts.css')

// Subsets the archive needs: English prose plus French diacritics (À, Œ, é).
const KEEP_SUBSETS = new Set(['latin', 'latin-ext'])

const FAMILIES = [
  'Courier+Prime:ital,wght@0,400;0,700;1,400',
  'IBM+Plex+Sans:ital,wght@0,400;0,500;1,400;1,500',
  'Old+Standard+TT:ital,wght@0,400;0,700;1,400',
  'Space+Mono:wght@400;700',
]

const CSS_URL =
  'https://fonts.googleapis.com/css2?family=' +
  FAMILIES.join('&family=') +
  '&display=swap'

// Google returns woff2 only for browsers that advertise support.
const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

function fetchOnce(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers }, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`${url} responded ${response.statusCode}`))
          return
        }
        const chunks = []
        response.on('data', (chunk) => chunks.push(chunk))
        response.on('end', () => resolve(Buffer.concat(chunks)))
      })
      .on('error', reject)
  })
}

// The font CDN intermittently 404s or drops a connection when a run pulls a few
// dozen files back to back, so a single failure is retried before it is treated
// as real.
async function fetchUrl(url, headers = {}, attempts = 4) {
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fetchOnce(url, headers)
    } catch (error) {
      lastError = error
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 500))
      }
    }
  }
  throw lastError
}

function slug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

async function main() {
  const css = (await fetchUrl(CSS_URL, { 'User-Agent': BROWSER_UA })).toString(
    'utf8'
  )

  // Every @font-face in the css2 payload is preceded by a /* subset */ comment.
  const faces = []
  const pattern = /\/\* ([a-z-]+) \*\/\s*(@font-face \{[\s\S]*?\})/g
  let match
  while ((match = pattern.exec(css))) {
    if (KEEP_SUBSETS.has(match[1])) {
      faces.push({ subset: match[1], body: match[2] })
    }
  }

  if (!faces.length) {
    throw new Error('No matching @font-face blocks found in the css2 payload.')
  }

  // Everything is fetched into memory before a single byte is written, so a
  // download that fails partway cannot leave the vendored set half-deleted.
  const byHash = new Map()
  const pending = new Map()
  const rules = []
  let bytes = 0

  for (const face of faces) {
    const field = (name) =>
      (face.body.match(new RegExp(`${name}:\\s*([^;]+);`)) || [])[1]?.trim()

    const family = (face.body.match(/font-family:\s*'([^']+)'/) || [])[1]
    const url = (face.body.match(/url\((https:\/\/[^)]+\.woff2)\)/) || [])[1]
    const style = field('font-style') || 'normal'
    const weight = field('font-weight') || '400'
    const range = field('unicode-range')
    if (!family || !url) continue

    const payload = await fetchUrl(url)
    const hash = sha256(payload)

    let filename = byHash.get(hash)
    if (!filename) {
      filename = `${slug(family)}-${weight}-${style}-${face.subset}.woff2`
      byHash.set(hash, filename)
      pending.set(filename, payload)
      bytes += payload.length
    }

    rules.push(
      `@font-face {\n` +
        `  font-family: '${family}';\n` +
        `  font-style: ${style};\n` +
        `  font-weight: ${weight};\n` +
        `  font-display: swap;\n` +
        `  src: url('/assets/fonts/${filename}') format('woff2');\n` +
        `  unicode-range: ${range};\n` +
        `}`
    )
  }

  // Every fetch succeeded; now it is safe to replace the vendored set.
  fs.rmSync(FONT_DIR, { recursive: true, force: true })
  fs.mkdirSync(FONT_DIR, { recursive: true })
  for (const [filename, payload] of pending) {
    fs.writeFileSync(path.join(FONT_DIR, filename), payload)
  }

  fs.writeFileSync(
    CSS_OUT,
    '/* Self-hosted webfonts — generated file, do not edit by hand.\n' +
      ' *\n' +
      ' * Written by scripts/vendor_fonts.cjs from the same css2 payload the site\n' +
      ' * once loaded from fonts.googleapis.com at runtime, reduced to the latin\n' +
      ' * and latin-ext subsets. Re-run that script to update.\n' +
      ' */\n\n' +
      rules.join('\n\n') +
      '\n'
  )

  console.log(
    `Vendored ${byHash.size} font files (${(bytes / 1024).toFixed(1)} KB) ` +
      `for ${rules.length} @font-face rules.\n` +
      `  fonts: ${path.relative(REPO, FONT_DIR)}\n` +
      `  css:   ${path.relative(REPO, CSS_OUT)}`
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
