import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..'
)
const SITE = path.join(ROOT, '_site')
const boxes = require('../../src/_data/larchiveBoxes.cjs')
const {
  createPrivatePreviewServer,
} = require('../../scripts/serve_larchive_private_preview.cjs')

describe("L'Archive container register", () => {
  it('keeps the control can outside five rows of five working cans', () => {
    const html = fs.readFileSync(
      path.join(SITE, 'l-archive', 'index.html'),
      'utf8'
    )
    const gridStart = html.indexOf('<ol class="archive-container-grid"')
    const gridEnd = html.indexOf('</ol>', gridStart)
    const workingGrid = html.slice(gridStart, gridEnd)
    const renderedIds = [...html.matchAll(/data-box-id="LE-BOX-(\d{3})"/g)].map(
      (match) => match[1]
    )
    const workingIds = [
      ...workingGrid.matchAll(/data-box-id="LE-BOX-(\d{3})"/g),
    ].map((match) => match[1])

    expect(gridStart).toBeGreaterThan(-1)
    expect(renderedIds).toEqual(
      Array.from({ length: 26 }, (_, sequence) =>
        String(sequence).padStart(3, '0')
      )
    )
    expect(workingIds).toEqual(
      Array.from({ length: 25 }, (_, index) =>
        String(index + 1).padStart(3, '0')
      )
    )
    expect(workingGrid).not.toContain('LE-BOX-000')
    expect(html.indexOf('archive-container-control-card')).toBeLessThan(
      gridStart
    )
    expect(html).toContain('05 rows / 05 cans per row')
    expect(html).toContain('05 open maximum')
  })

  it('publishes only the safe register projection', () => {
    const html = fs.readFileSync(
      path.join(SITE, 'l-archive', 'index.html'),
      'utf8'
    )

    expect(boxes).toHaveLength(26)
    expect(boxes.map((box) => box.sequenceLabel)).toEqual(
      Array.from({ length: 26 }, (_, sequence) =>
        String(sequence).padStart(3, '0')
      )
    )
    expect(html).toContain('LE-TUPPER')
    expect(html).toContain("fetch('/__operator/register.json'")
    expect(html).not.toContain('private-preview')
    expect(html).not.toContain('intake/LE-BOX')
    expect(html).not.toMatch(/IMG_43\d{2}/)
  })
})

describe('private L’Archive preview server', () => {
  let fixtureRoot
  let server
  let port

  function request(requestPath, options = {}) {
    return new Promise((resolve, reject) => {
      const requestOptions = {
        headers: {
          Host: options.host || `127.0.0.1:${port}`,
        },
        hostname: '127.0.0.1',
        method: options.method || 'GET',
        path: requestPath,
        port,
      }
      const outgoing = http.request(requestOptions, (response) => {
        const chunks = []
        response.on('data', (chunk) => chunks.push(chunk))
        response.on('end', () => {
          resolve({
            body: Buffer.concat(chunks).toString('utf8'),
            headers: response.headers,
            statusCode: response.statusCode,
          })
        })
      })
      outgoing.on('error', reject)
      outgoing.end()
    })
  }

  beforeAll(async () => {
    fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fi-larchive-preview-'))
    fs.mkdirSync(path.join(fixtureRoot, 'assets'))
    fs.writeFileSync(
      path.join(fixtureRoot, 'register.json'),
      '{"records":{}}\n'
    )
    fs.writeFileSync(path.join(fixtureRoot, 'assets', 'witness.png'), 'test')

    server = createPrivatePreviewServer({
      operatorRoot: fixtureRoot,
      siteRoot: SITE,
    })
    await new Promise((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, '127.0.0.1', resolve)
    })
    port = server.address().port
  })

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve))
    }
    if (fixtureRoot) {
      fs.rmSync(fixtureRoot, { force: true, recursive: true })
    }
  })

  it('serves the operator register only through an allowed loopback Host', async () => {
    const allowed = await request('/__operator/register.json')
    const denied = await request('/__operator/register.json', {
      host: 'attacker.example',
    })

    expect(allowed.statusCode).toBe(200)
    expect(allowed.headers['cache-control']).toBe('no-store, max-age=0')
    expect(allowed.headers['cross-origin-resource-policy']).toBe('same-origin')
    expect(allowed.headers['x-frame-options']).toBe('DENY')
    expect(denied.statusCode).toBe(403)
    expect(denied.body).toBe('Loopback host required.\n')
  })

  it('blocks operator path traversal and implements bodyless HEAD responses', async () => {
    const traversal = await request(
      '/__operator/assets/%2e%2e%2f%2e%2e%2fregister.json'
    )
    const head = await request('/__operator/register.json', {
      method: 'HEAD',
    })

    expect(traversal.statusCode).toBe(403)
    expect(head.statusCode).toBe(200)
    expect(head.body).toBe('')
    expect(head.headers['content-length']).toBe('15')
  })
})
