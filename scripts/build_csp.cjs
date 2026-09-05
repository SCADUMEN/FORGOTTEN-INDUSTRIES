#!/usr/bin/env node
'use strict'

// Generates the Content-Security-Policy header from the built site and writes
// it into _site/_headers.
//
// The policy is derived, not hand-maintained: every inline script that survives
// in _site is hashed here, so the header can never drift from what actually
// ships. Editing an inline script without rebuilding is therefore impossible to
// get wrong — the hash is recomputed from the same bytes the browser will see.
//
// Run with --check to verify the committed policy matches the built site
// without writing (used to catch a stale _headers in CI).

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const SITE = path.join(__dirname, '..', '_site')
const HEADERS = path.join(SITE, '_headers')

// CxR fetches nor and any pasted URL through this proxy rather than directly,
// so it is the only origin CxR ever connects to. Overriding VITE_CORS_PROXY at
// build time means updating this value to match.
const CORS_PROXY = 'https://cors-proxy.vaporwavemall.com'

// ZOOT streams its mixtape from Northern Information's asset host, which serves
// HTTP range requests the archive's own host does not. The <audio> element is
// created in JavaScript rather than written into the HTML, so this origin is
// invisible to a source grep — it was found by loading the page under the
// policy and reading the violation.
const ZOOT_MEDIA = 'https://assets.the-rn.info'

// A <script> whose type is not a JavaScript type is a data block: the browser
// never executes it, and CSP does not govern it. The archive's 1000+ JSON-LD
// provenance blocks fall here and must not be hashed — doing so would bloat the
// header with entries that protect nothing.
const JS_TYPE = /^(text\/javascript|application\/javascript|module)$/i

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, acc)
    else if (entry.name.endsWith('.html')) acc.push(full)
  }
  return acc
}

function isExecutable(attrs) {
  const match = attrs.match(/type\s*=\s*["']([^"']+)["']/i)
  return !match || JS_TYPE.test(match[1].trim())
}

function collectScriptHashes(files) {
  const hashes = new Map()
  for (const file of files) {
    const html = fs.readFileSync(file, 'utf8')
    const pattern = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi
    for (const match of html.matchAll(pattern)) {
      if (!isExecutable(match[1] || '')) continue
      const digest = crypto
        .createHash('sha256')
        .update(match[2], 'utf8')
        .digest('base64')
      if (!hashes.has(digest)) hashes.set(digest, path.relative(SITE, file))
    }
  }
  return hashes
}

function buildPolicy(scriptHashes) {
  const scriptSrc = [
    "'self'",
    ...[...scriptHashes.keys()].sort().map((h) => `'sha256-${h}'`),
  ]

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(' ')}`,
    // Hashes are deliberately absent here. Twelve pages carry style="..."
    // attributes, which a hash cannot cover, and under CSP Level 3 the presence
    // of any hash in style-src causes 'unsafe-inline' to be ignored — which
    // would break those attributes. Style injection is a far narrower risk than
    // script injection, so this directive is intentionally the weak one.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self'",
    "font-src 'self'",
    `media-src 'self' ${ZOOT_MEDIA}`,
    `connect-src 'self' ${CORS_PROXY}`,
    "frame-src 'self'",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    'upgrade-insecure-requests',
  ].join('; ')
}

function writePolicy(policy) {
  let headers = fs.readFileSync(HEADERS, 'utf8')
  headers = headers.replace(
    /^\/\*\n/m,
    `/*\n  Content-Security-Policy: ${policy}\n`
  )
  fs.writeFileSync(HEADERS, headers)
}

function main() {
  const check = process.argv.includes('--check')

  if (!fs.existsSync(HEADERS)) {
    console.error('_site/_headers is missing; run the site build first.')
    process.exit(1)
  }

  const files = walk(SITE)
  const scriptHashes = collectScriptHashes(files)
  const policy = buildPolicy(scriptHashes)
  const existing = fs.readFileSync(HEADERS, 'utf8')

  if (check) {
    if (!existing.includes(`Content-Security-Policy: ${policy}`)) {
      console.error(
        'Content-Security-Policy in _site/_headers does not match the built site.'
      )
      console.error(
        'Run `npm run build:csp` (or a full build) to regenerate it.'
      )
      process.exit(1)
    }
    console.log(
      `Content-Security-Policy verified: ${scriptHashes.size} inline script hash(es).`
    )
    return
  }

  if (existing.includes('Content-Security-Policy:')) {
    console.log(
      'Content-Security-Policy already present; leaving it unchanged.'
    )
    return
  }

  writePolicy(policy)
  console.log(
    `Content-Security-Policy written: ${scriptHashes.size} inline script hash(es) over ${files.length} pages.`
  )
  for (const [digest, file] of scriptHashes) {
    console.log(`  sha256-${digest.slice(0, 12)}...  first seen in ${file}`)
  }
}

main()
