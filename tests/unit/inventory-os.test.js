import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const {
  createInventoryServer,
  databaseToCsv,
  isAllowedHost,
  resolveWithin,
} = require('../../scripts/inventory-os/server.cjs')

const profile = {
  id: 'test-can',
  sku: 'TEST-CAN',
  name: 'Test can',
  checklists: {
    inspection: ['Inspect'],
    cleaning: ['Clean'],
    photography: ['Photograph'],
    packing: ['Pack'],
  },
  listing: {
    titleTemplate: '{{condition}} {{productName}} {{id}}',
    descriptionTemplate: '{{id}}\n{{notes}}',
  },
  shipping: {},
}

describe('inventory operating instrument', () => {
  let dataRoot
  let server
  let port

  function request(requestPath, options = {}) {
    return new Promise((resolve, reject) => {
      const body = options.body ? JSON.stringify(options.body) : ''
      const outgoing = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path: requestPath,
          method: options.method || 'GET',
          headers: {
            Host: options.host || `127.0.0.1:${port}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
          },
        },
        (response) => {
          const chunks = []
          response.on('data', (chunk) => chunks.push(chunk))
          response.on('end', () => {
            const text = Buffer.concat(chunks).toString('utf8')
            resolve({
              status: response.statusCode,
              headers: response.headers,
              body: response.headers['content-type']?.includes('json')
                ? JSON.parse(text)
                : text,
            })
          })
        }
      )
      outgoing.on('error', reject)
      outgoing.end(body)
    })
  }

  beforeAll(async () => {
    dataRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fi-inventory-os-'))
    server = createInventoryServer({ dataRoot, profiles: [profile] })
    await new Promise((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, '127.0.0.1', resolve)
    })
    port = server.address().port
  })

  afterAll(async () => {
    if (server) await new Promise((resolve) => server.close(resolve))
    if (dataRoot) fs.rmSync(dataRoot, { recursive: true, force: true })
  })

  it('creates one unique record per unit in a recognized batch trade', async () => {
    const created = await request('/api/batches', {
      method: 'POST',
      body: {
        profileId: 'test-can',
        quantity: 6,
        purchaseCostEach: 5,
        stage: 'archived',
        transactionGroup: 'TRADE-01',
        disposition: {
          type: 'trade',
          proceedsType: 'store-credit',
          financialStatus: 'recognized',
          valueTotal: 30,
        },
      },
    })
    const state = await request('/api/state')

    expect(created.status).toBe(201)
    expect(new Set(created.body.items.map((item) => item.id)).size).toBe(6)
    expect(created.body.items.every((item) => item.purchaseCost === 5)).toBe(
      true
    )
    expect(
      created.body.items.every((item) => item.disposition.value === 5)
    ).toBe(true)
    expect(state.body.metrics.storeCreditValue).toBe(30)
    expect(state.body.metrics.storeCreditBalance).toBe(30)
    expect(state.body.metrics.profit).toBe(0)

    await request(`/api/items/${created.body.items[0].id}`, {
      method: 'PATCH',
      body: { disposition: { creditRedeemedValue: 5 } },
    })
    const redeemed = await request('/api/state')
    expect(redeemed.body.metrics.storeCreditRedeemed).toBe(5)
    expect(redeemed.body.metrics.storeCreditBalance).toBe(25)

    await request(`/api/items/${created.body.items[0].id}`, {
      method: 'PATCH',
      body: {
        disposition: {
          adjustments: [
            {
              type: 'rebate',
              label: 'Customer rebate',
              amount: 2,
            },
          ],
        },
      },
    })
    const adjusted = await request('/api/state')
    expect(adjusted.body.metrics.recognizedAdjustments).toBe(2)
    expect(adjusted.body.metrics.profit).toBe(-2)

    await request(`/api/items/${created.body.items[0].id}`, {
      method: 'PATCH',
      body: { disposition: { adjustments: [] } },
    })
  })

  it('keeps unpriced sales out of recognized revenue and records financial gaps', async () => {
    await request('/api/batches', {
      method: 'POST',
      body: {
        profileId: 'test-can',
        quantity: 3,
        purchaseCostEach: 5,
        stage: 'sold',
        marketplace: 'eBay',
        disposition: {
          type: 'sale',
          proceedsType: 'cash',
          financialStatus: 'unresolved',
        },
      },
    })
    const state = await request('/api/state')
    const unresolvedItem = state.body.database.items.find(
      (item) => item.disposition.type === 'sale'
    )
    await request(`/api/items/${unresolvedItem.id}`, {
      method: 'PATCH',
      body: {
        disposition: {
          value: 15.95,
          financialStatus: 'unresolved',
        },
      },
    })
    const pricedState = await request('/api/state')

    expect(state.body.metrics.itemCount).toBe(9)
    expect(pricedState.body.metrics.grossCashValue).toBe(15.95)
    expect(pricedState.body.metrics.revenue).toBe(0)
    expect(pricedState.body.metrics.storeCreditValue).toBe(30)
    expect(pricedState.body.metrics.profit).toBe(0)
    expect(pricedState.body.metrics.unresolvedFinancialCount).toBe(3)
    expect(pricedState.body.metrics.averageDaysToSell).toBeNull()
  })

  it('persists record edits, lifecycle transitions, photos, and audit events', async () => {
    const state = await request('/api/state')
    const item = state.body.database.items[0]
    const updated = await request(`/api/items/${item.id}`, {
      method: 'PATCH',
      body: {
        storageLocation: 'SHELF-A',
        shipping: { carrier: 'USPS', tracking: 'TEST-TRACKING' },
      },
    })
    const transitioned = await request(`/api/items/${item.id}/transition`, {
      method: 'POST',
      body: { stage: 'packing' },
    })
    const photo = await request(`/api/items/${item.id}/photos`, {
      method: 'POST',
      body: {
        name: 'witness.png',
        type: 'image/png',
        data: 'data:image/png;base64,iVBORw0KGgo=',
      },
    })
    const finalState = await request('/api/state')

    expect(updated.body.storageLocation).toBe('SHELF-A')
    expect(transitioned.body.stage).toBe('packing')
    expect(photo.body.photos).toHaveLength(1)
    expect(
      finalState.body.database.audit.some(
        (entry) => entry.action === 'stage.transitioned'
      )
    ).toBe(true)
  })

  it('registers R+D deployments without recognizing hypothetical returns', async () => {
    const created = await request('/api/research-deployments', {
      method: 'POST',
      body: {
        title: 'Bench capability tool',
        deployedAt: '2026-07-30',
        amount: 30,
        fundingType: 'store-credit',
        classification: 'capability-asset',
        status: 'active',
        operatingRegion: 'Kansas',
        profitPathway: 'Supports future paid restoration work.',
        catalogRef: '49097',
        seller: 'source-seller',
        orderStatus: 'paid',
        deliveryState: 'tracking available',
        identificationConfidence: 'model-visible',
        silverProfile: {
          pieceCount: 104,
          grossWeightGrams: 627.38,
          elementalSilverGrams: 580.31,
          fineTroyOunces: 18.66,
          provisionalPieceCount: 2,
          verificationState: 'conditional working estimate',
          basisScope: 'Completed coin-category orders only.',
        },
      },
    })
    const state = await request('/api/state')

    expect(created.status).toBe(201)
    expect(created.body.id).toBe('FI-RD-000001')
    expect(state.body.metrics.researchDeployed).toBe(30)
    expect(state.body.metrics.researchCashDeployed).toBe(0)
    expect(state.body.metrics.researchCapacityBasis).toBe(30)
    expect(state.body.metrics.researchRealizedReturn).toBe(0)
    expect(state.body.metrics.researchSilverPieceCount).toBe(104)
    expect(state.body.metrics.researchElementalSilverGrams).toBe(580.31)
    expect(state.body.metrics.researchFineSilverOzt).toBe(18.66)
    expect(state.body.metrics.researchSilverProvisionalPieceCount).toBe(2)
    expect(created.body.catalogRef).toBe('49097')
    expect(created.body.seller).toBe('source-seller')
    expect(created.body.photos).toEqual([])
    expect(created.body.silverProfile.verificationState).toBe(
      'conditional working estimate'
    )
  })

  it('attaches local evidence thumbnails to R+D deployments', async () => {
    const created = await request('/api/research-deployments', {
      method: 'POST',
      body: { title: 'Watch evidence test', amount: 20 },
    })
    const photo = await request(
      `/api/research-deployments/${created.body.id}/photos`,
      {
        method: 'POST',
        body: {
          name: 'watch.png',
          type: 'image/png',
          data: 'data:image/png;base64,iVBORw0KGgo=',
        },
      }
    )

    expect(photo.status).toBe(201)
    expect(photo.body.photos).toHaveLength(1)
    expect(photo.body.photos[0].status).toBe('source-evidence')

    const patched = await request(
      `/api/research-deployments/${created.body.id}`,
      {
        method: 'PATCH',
        body: {
          title: 'Identified watch',
          amount: 25,
          status: 'acquired-unused',
        },
      }
    )
    expect(patched.status).toBe(200)
    expect(patched.body).toMatchObject({
      title: 'Identified watch',
      amount: 25,
      status: 'acquired-unused',
    })
    expect(patched.body.photos).toHaveLength(1)
  })

  it('exports safe CSV and restricts service to loopback paths and hosts', async () => {
    const state = await request('/api/state')
    state.body.database.items[0].notes = '=HYPERLINK("bad")'
    const csv = databaseToCsv(state.body.database)
    const denied = await request('/api/state', { host: 'attacker.example' })

    expect(csv).toContain('FI-INV-')
    expect(isAllowedHost('localhost:8093')).toBe(true)
    expect(isAllowedHost('attacker.example')).toBe(false)
    expect(resolveWithin(dataRoot, '/../escape')).toBeNull()
    expect(denied.status).toBe(403)
  })

  it('serves two operator routes from one private data core', async () => {
    const inventory = await request('/inventory/')
    const laboratory = await request('/rd/')
    const state = await request('/api/state')

    expect(inventory.status).toBe(200)
    expect(laboratory.status).toBe(200)
    expect(inventory.headers['x-robots-tag']).toContain('noindex')
    expect(laboratory.headers['x-robots-tag']).toContain('noindex')
    expect(inventory.body).toContain("L'INVENTAIRE")
    expect(laboratory.body).toContain('LE LABORATOIRE')
    expect(laboratory.body).toContain('ELEMENTAL AG')
    expect(state.body.database.items).toHaveLength(9)
    expect(state.body.database.researchDeployments).toHaveLength(2)
  })
})
