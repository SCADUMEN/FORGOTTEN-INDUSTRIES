const fs = require('node:fs')
const path = require('node:path')
const { exiftool } = require('exiftool-vendored')
const { findLocationTags, isMedia } = require('./location_metadata.cjs')

const root = path.resolve(__dirname, '..')
const site = path.join(root, '_site')
const textExtensions = new Set([
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
const forbiddenNames = [
  /(^|\/)\.env(?:\.[^/]*)?$/i,
  /(^|\/)(?:id_rsa|id_ed25519|passphrase\.txt)$/i,
  /\.(?:key|kdbx|p12|pem|pfx)$/i,
]
// A leaked local path is never itself part of a larger token — it starts at
// a quote, whitespace, punctuation, or the start of a string. Without that
// boundary, these patterns also match a URL path segment that happens to
// read the same way, e.g. `/home/` inside `https://caselabs.se/home/manuals/`,
// a real external reference a record can legitimately cite. The lookbehind
// excludes exactly that case — the character directly before the match is a
// domain-name character (letters, digits, `.`, `-`) — while still catching a
// genuine `file:///home/...` URI, where the preceding character is `/`.
const NOT_PRECEDED_BY_HOSTNAME = '(?<![A-Za-z0-9.-])'
const forbiddenContent = [
  ['private key material', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['GitHub credential', /\bgh(?:o|p|s|u|r)_[A-Za-z0-9]{20,}\b/],
  ['GitHub fine-grained credential', /\bgithub_pat_[A-Za-z0-9_]{20,}\b/],
  ['AWS access key', /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/],
  ['OpenAI-style credential', /\bsk-[A-Za-z0-9_-]{20,}\b/],
  [
    'macOS user path',
    new RegExp(`${NOT_PRECEDED_BY_HOSTNAME}/Users/[A-Za-z0-9._-]+/`),
  ],
  [
    'Linux user path',
    new RegExp(`${NOT_PRECEDED_BY_HOSTNAME}/home/[A-Za-z0-9._-]+/`),
  ],
  ['Windows user path', /[A-Z]:\\Users\\[^\\]+\\/i],
  [
    'temporary workstation path',
    new RegExp(`${NOT_PRECEDED_BY_HOSTNAME}/private/tmp(?:/|\\b)`),
  ],
  ['mounted-volume path', new RegExp(`${NOT_PRECEDED_BY_HOSTNAME}/Volumes/`)],
  [
    'home-relative workstation path',
    /~\/(?:Documents|Desktop|Downloads)(?:\/|\b)/,
  ],
]
const protectedPhrases = [
  'Boutique Systems Division',
  'Multi-Vertical Services Launch',
  'The Vision Intake Methodology',
  'Revenue Vertical Map',
]

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name)
    return entry.isDirectory() ? walk(absolute) : [absolute]
  })
}

async function main() {
  if (!fs.existsSync(site)) {
    throw new Error('Public surface audit requires a completed _site build.')
  }

  const files = walk(site)
  const findings = []
  let scannedTextFiles = 0
  let scannedMediaFiles = 0

  for (const absolute of files) {
    const relative = path.relative(site, absolute).split(path.sep).join('/')

    for (const pattern of forbiddenNames) {
      if (pattern.test(relative)) {
        findings.push(`${relative}: forbidden public filename`)
      }
    }

    const extension = path.extname(relative).toLowerCase()

    if (isMedia(absolute)) {
      scannedMediaFiles += 1
      const tags = await exiftool.readRaw(absolute)
      const locationTags = findLocationTags(tags)
      if (locationTags.length > 0) {
        findings.push(
          `${relative}: media GPS/location metadata (${locationTags.length} tags)`
        )
      }
      continue
    }

    if (!textExtensions.has(extension)) continue

    let content = fs.readFileSync(absolute, 'utf8')
    scannedTextFiles += 1

    if (
      relative.startsWith('assets/restricted/') &&
      relative.endsWith('.json')
    ) {
      const payload = JSON.parse(content)
      const metadata = { ...payload }
      delete metadata.ciphertext
      delete metadata.iv
      delete metadata.salt
      content = JSON.stringify(metadata)
    }

    for (const [label, pattern] of forbiddenContent) {
      if (pattern.test(content)) findings.push(`${relative}: ${label}`)
    }

    for (const phrase of protectedPhrases) {
      if (content.includes(phrase)) {
        findings.push(`${relative}: restricted briefing plaintext`)
      }
    }
  }

  if (findings.length > 0) {
    process.stderr.write(
      `Public surface audit failed:\n${findings.join('\n')}\n`
    )
    process.exitCode = 1
  } else {
    process.stdout.write(
      `Public surface audit passed: ${files.length} files, ${scannedTextFiles} text surfaces, ${scannedMediaFiles} media files.\n`
    )
  }
}

if (require.main === module) {
  main()
    .then(() => exiftool.end())
    .catch(async (err) => {
      await exiftool.end().catch(() => {})
      process.stderr.write(`${err.stack || err}\n`)
      process.exitCode = 1
    })
}

module.exports = { main, walk, forbiddenContent, forbiddenNames }
