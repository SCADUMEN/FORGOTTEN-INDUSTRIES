const fs = require('node:fs')
const http = require('node:http')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const siteRoot = path.join(projectRoot, '_site')
const operatorRoot = path.join(
  projectRoot,
  'intake',
  'LE-BOX-001-012',
  'private-preview'
)
const port = Number(process.env.LARCHIVE_PRIVATE_PORT || 8091)

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8',
}

const securityHeaders = {
  'Content-Security-Policy':
    "default-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'",
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy':
    'camera=(), geolocation=(), microphone=(), payment=(), usb=()',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
}

function resolveWithin(root, requestPath) {
  const candidate = path.resolve(root, `.${requestPath}`)
  if (candidate === root || candidate.startsWith(`${root}${path.sep}`)) {
    return candidate
  }
  return null
}

function isAllowedHost(hostHeader) {
  if (!hostHeader) return false

  try {
    const authority = new URL(`http://${hostHeader}`)
    return (
      !authority.username &&
      !authority.password &&
      (authority.hostname === '127.0.0.1' || authority.hostname === 'localhost')
    )
  } catch {
    return false
  }
}

function sendText(response, statusCode, body, headers = {}) {
  response.writeHead(statusCode, {
    ...securityHeaders,
    'Content-Type': 'text/plain; charset=utf-8',
    ...headers,
  })
  response.end(body)
}

function sendFile(request, response, filePath, operatorSource = false) {
  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      sendText(response, 404, 'Record not found.\n')
      return
    }

    response.writeHead(200, {
      ...securityHeaders,
      'Cache-Control': operatorSource
        ? 'no-store, max-age=0'
        : 'no-cache, max-age=0',
      'Content-Length': stats.size,
      'Content-Type':
        contentTypes[path.extname(filePath).toLowerCase()] ||
        'application/octet-stream',
    })

    if (request.method === 'HEAD') {
      response.end()
      return
    }

    fs.createReadStream(filePath).pipe(response)
  })
}

function createPrivatePreviewServer(options = {}) {
  const resolvedSiteRoot = options.siteRoot || siteRoot
  const resolvedOperatorRoot = options.operatorRoot || operatorRoot

  return http.createServer((request, response) => {
    if (!isAllowedHost(request.headers.host)) {
      sendText(response, 403, 'Loopback host required.\n')
      return
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      sendText(response, 405, 'Read-only preview.\n', {
        Allow: 'GET, HEAD',
      })
      return
    }

    let pathname

    try {
      const url = new URL(request.url || '/', 'http://127.0.0.1')
      pathname = decodeURIComponent(url.pathname)
    } catch {
      sendText(response, 400, 'Invalid request path.\n')
      return
    }

    if (pathname === '/__operator/register.json') {
      sendFile(
        request,
        response,
        path.join(resolvedOperatorRoot, 'register.json'),
        true
      )
      return
    }

    if (pathname.startsWith('/__operator/assets/')) {
      const relativeAsset = pathname.slice('/__operator'.length)
      const filePath = resolveWithin(resolvedOperatorRoot, relativeAsset)
      if (!filePath) {
        sendText(response, 403, 'Path outside operator register.\n')
        return
      }
      sendFile(request, response, filePath, true)
      return
    }

    const publicPath = pathname.endsWith('/')
      ? `${pathname}index.html`
      : pathname
    const filePath = resolveWithin(resolvedSiteRoot, publicPath)

    if (!filePath) {
      sendText(response, 403, 'Path outside preview.\n')
      return
    }

    sendFile(request, response, filePath)
  })
}

if (require.main === module) {
  const server = createPrivatePreviewServer()

  server.listen(port, '127.0.0.1', () => {
    console.log(
      `[larchive:private] local operator preview: http://127.0.0.1:${port}/l-archive/`
    )
    console.log(
      '[larchive:private] loopback + Host restricted / no network exposure'
    )
  })
}

module.exports = {
  createPrivatePreviewServer,
  isAllowedHost,
  resolveWithin,
}
