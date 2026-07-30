'use strict'

const rawBase = process.argv[2] || process.env.WORKER_BASE_URL

if (!rawBase) {
  process.stderr.write(
    'Usage: npm run verify:worker -- https://<worker>.workers.dev\n'
  )
  process.exit(2)
}

const base = new URL(rawBase)
const isLocal = ['127.0.0.1', 'localhost'].includes(base.hostname)

if (base.protocol !== 'https:' && !isLocal) {
  throw new Error('Worker verification requires HTTPS outside localhost.')
}

async function request(pathname, options = {}) {
  const response = await fetch(new URL(pathname, base), {
    redirect: options.redirect || 'follow',
  })

  if (response.status !== options.status) {
    throw new Error(
      `${pathname}: expected HTTP ${options.status}, received ${response.status}`
    )
  }

  const contentType = response.headers.get('content-type') || ''
  if (options.contentType && !contentType.includes(options.contentType)) {
    throw new Error(
      `${pathname}: expected content type ${options.contentType}, received ${contentType || 'none'}`
    )
  }

  if (options.location) {
    const location = response.headers.get('location')
    if (location !== options.location) {
      throw new Error(
        `${pathname}: expected Location ${options.location}, received ${location || 'none'}`
      )
    }
  }

  let body = ''
  if (options.readBody === false) {
    await response.body?.cancel()
  } else {
    body = await response.text()
  }
  if (options.includes && !body.includes(options.includes)) {
    throw new Error(`${pathname}: expected response marker is absent`)
  }

  if (options.json) JSON.parse(body)

  return response
}

async function main() {
  const checks = [
    [
      '/',
      {
        status: 200,
        contentType: 'text/html',
        includes: 'Forgotten Industries',
      },
    ],
    [
      '/l-archive/',
      { status: 200, contentType: 'text/html', includes: "L'Archive" },
    ],
    [
      '/oeuvre/',
      { status: 200, contentType: 'text/html', includes: "L'Œuvre" },
    ],
    [
      '/signal/',
      { status: 200, contentType: 'text/html', includes: 'Le Signal' },
    ],
    [
      '/apropos/',
      { status: 200, contentType: 'text/html', includes: 'À Propos' },
    ],
    [
      '/instruments/field-terminal/',
      { status: 200, contentType: 'text/html', includes: 'Field Terminal' },
    ],
    [
      '/.well-known/security.txt',
      { status: 200, contentType: 'text/plain', includes: 'Contact:' },
    ],
    ['/feed.xml', { status: 200, contentType: 'xml', includes: '<feed' }],
    [
      '/sitemap.xml',
      {
        status: 200,
        contentType: 'xml',
        includes: '/instruments/field-terminal/',
      },
    ],
    [
      '/dist/forgotten-industries.json',
      { status: 200, contentType: 'application/json', json: true },
    ],
    [
      '/assets/instruments/field-terminal/fi-field-terminal-kit-v1.zip',
      { status: 200, contentType: 'application/zip', readBody: false },
    ],
    [
      '/archive.html',
      { status: 301, location: '/l-archive/', redirect: 'manual' },
    ],
    ['/this-record-does-not-exist-verify-404', { status: 404 }],
  ]

  for (const [pathname, options] of checks) {
    await request(pathname, options)
    process.stdout.write(`ok ${options.status} ${pathname}\n`)
  }

  const response = await fetch(new URL('/', base))
  const robots = response.headers.get('x-robots-tag') || ''
  if (base.hostname.endsWith('.workers.dev')) {
    if (!robots.toLowerCase().includes('noindex')) {
      throw new Error('Workers preview is missing X-Robots-Tag: noindex.')
    }
    process.stdout.write('ok noindex workers.dev preview\n')
  } else if (
    base.hostname === 'forgotten-industries.net' &&
    robots.toLowerCase().includes('noindex')
  ) {
    throw new Error('Production custom domain must remain indexable.')
  }

  process.stdout.write(
    `Worker release verification passed: ${checks.length} endpoints.\n`
  )
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`)
  process.exitCode = 1
})
