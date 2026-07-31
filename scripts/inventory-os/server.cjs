const fs = require('node:fs')
const http = require('node:http')
const path = require('node:path')
const { randomUUID } = require('node:crypto')

const projectRoot = path.resolve(__dirname, '..', '..')
const defaultDataRoot = path.join(projectRoot, '.tools', 'inventory-os')
const defaultPublicRoot = path.join(__dirname, 'public')
const profilesRoot = path.join(__dirname, 'profiles')

const STAGES = [
  'intake',
  'inspection',
  'cleaning',
  'photography',
  'storage',
  'listing',
  'published',
  'sold',
  'label',
  'packing',
  'shipped',
  'archived',
]

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.heic': 'image/heic',
  '.html': 'text/html; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.webp': 'image/webp',
}

const securityHeaders = {
  'Cache-Control': 'no-store, max-age=0',
  'Content-Security-Policy':
    "default-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data: blob:; style-src 'self'; script-src 'self'; connect-src 'self'",
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy':
    'camera=(), geolocation=(), microphone=(), payment=(), usb=()',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
}

function isAllowedHost(hostHeader) {
  if (!hostHeader) return false
  try {
    const host = new URL(`http://${hostHeader}`)
    return (
      !host.username &&
      !host.password &&
      (host.hostname === '127.0.0.1' || host.hostname === 'localhost')
    )
  } catch {
    return false
  }
}

function resolveWithin(root, requestPath) {
  const candidate = path.resolve(root, `.${requestPath}`)
  if (candidate === root || candidate.startsWith(`${root}${path.sep}`)) {
    return candidate
  }
  return null
}

function nowIso(clock = Date) {
  return new clock().toISOString()
}

function numberOrZero(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function loadProfiles() {
  return fs
    .readdirSync(profilesRoot)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) =>
      JSON.parse(fs.readFileSync(path.join(profilesRoot, file), 'utf8'))
    )
}

function createEmptyDatabase(timestamp) {
  return {
    schemaVersion: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
    nextSequence: 1,
    nextResearchSequence: 1,
    items: [],
    researchDeployments: [],
    audit: [],
  }
}

function atomicWriteJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  const temporaryPath = `${filePath}.${process.pid}.${Date.now()}.tmp`
  fs.writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, {
    mode: 0o600,
  })
  fs.renameSync(temporaryPath, filePath)
}

function createStore({ dataRoot = defaultDataRoot, clock = Date } = {}) {
  const databasePath = path.join(dataRoot, 'inventory.json')
  const uploadsRoot = path.join(dataRoot, 'uploads')
  fs.mkdirSync(uploadsRoot, { recursive: true, mode: 0o700 })

  if (!fs.existsSync(databasePath)) {
    atomicWriteJson(databasePath, createEmptyDatabase(nowIso(clock)))
  }

  let database = JSON.parse(fs.readFileSync(databasePath, 'utf8'))
  database.nextResearchSequence ||= 1
  database.researchDeployments ||= []
  let writeQueue = Promise.resolve()

  function read() {
    return structuredClone(database)
  }

  function mutate(mutator) {
    writeQueue = writeQueue.then(() => {
      const draft = structuredClone(database)
      const result = mutator(draft)
      draft.updatedAt = nowIso(clock)
      atomicWriteJson(databasePath, draft)
      database = draft
      return result
    })
    return writeQueue
  }

  return { dataRoot, databasePath, uploadsRoot, read, mutate }
}

function profileMap(profiles) {
  return new Map(profiles.map((profile) => [profile.id, profile]))
}

function applyTemplate(template, item) {
  const values = {
    id: item.id,
    sku: item.sku,
    productName: item.productName,
    condition: item.conditionGrade || 'ungraded',
    notes: item.notes || '',
  }
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] ?? '')
}

function generateListing(item, profile) {
  return {
    ...item.listing,
    title: applyTemplate(profile.listing.titleTemplate, item)
      .replace(/\s+/g, ' ')
      .trim(),
    description: applyTemplate(profile.listing.descriptionTemplate, item)
      .replace(/\n{3,}/g, '\n\n')
      .trim(),
    generatedAt: new Date().toISOString(),
  }
}

function calculateMetrics(database) {
  const researchDeployments = database.researchDeployments || []
  const deployedResearch = researchDeployments.filter(
    (deployment) => deployment.status !== 'planned'
  )
  const researchDeployed = deployedResearch.reduce(
    (sum, deployment) => sum + numberOrZero(deployment.amount),
    0
  )
  const researchCashDeployed = deployedResearch.reduce(
    (sum, deployment) =>
      sum +
      (deployment.fundingType === 'cash' ? numberOrZero(deployment.amount) : 0),
    0
  )
  const researchNonCashDeployed = researchDeployed - researchCashDeployed
  const researchCapacityBasis = deployedResearch.reduce(
    (sum, deployment) =>
      sum +
      (deployment.classification !== 'training-consumable'
        ? numberOrZero(deployment.amount)
        : 0),
    0
  )
  const researchRealizedReturn = deployedResearch.reduce(
    (sum, deployment) => sum + numberOrZero(deployment.realizedReturn),
    0
  )
  const fulfillmentStages = new Set(['sold', 'label', 'packing', 'shipped'])
  const soldItems = database.items.filter(
    (item) =>
      ['sale', 'trade'].includes(item.disposition?.type) ||
      fulfillmentStages.has(item.stage)
  )
  const grossCashValue = soldItems.reduce(
    (sum, item) =>
      sum +
      (item.disposition?.proceedsType === 'cash'
        ? numberOrZero(item.disposition.value)
        : 0),
    0
  )
  const cashRevenue = soldItems.reduce(
    (sum, item) =>
      sum +
      (item.disposition?.proceedsType === 'cash' &&
      item.disposition?.financialStatus === 'recognized'
        ? numberOrZero(item.disposition.value)
        : 0),
    0
  )
  const storeCreditValue = soldItems.reduce(
    (sum, item) =>
      sum +
      (item.disposition?.proceedsType === 'store-credit' &&
      item.disposition?.financialStatus === 'recognized'
        ? numberOrZero(item.disposition.value)
        : 0),
    0
  )
  const storeCreditRedeemed = soldItems.reduce(
    (sum, item) =>
      sum +
      (item.disposition?.proceedsType === 'store-credit'
        ? numberOrZero(item.disposition.creditRedeemedValue)
        : 0),
    0
  )
  const recognizedValue = cashRevenue + storeCreditValue
  const recognizedItems = soldItems.filter(
    (item) => item.disposition?.financialStatus === 'recognized'
  )
  const recognizedCosts = recognizedItems.reduce(
    (sum, item) =>
      sum +
      numberOrZero(item.purchaseCost) +
      numberOrZero(item.listing.fees) +
      numberOrZero(item.shipping.cost) +
      (item.disposition?.adjustments || []).reduce(
        (adjustmentSum, adjustment) =>
          adjustmentSum + numberOrZero(adjustment.amount),
        0
      ),
    0
  )
  const recognizedAdjustments = recognizedItems.reduce(
    (sum, item) =>
      sum +
      (item.disposition?.adjustments || []).reduce(
        (adjustmentSum, adjustment) =>
          adjustmentSum + numberOrZero(adjustment.amount),
        0
      ),
    0
  )
  const sellTimes = soldItems
    .map((item) => {
      const sold = item.stageHistory.find(
        (entry) => entry.stage === 'sold' && !entry.imported
      )
      return sold
        ? (new Date(sold.enteredAt) - new Date(item.createdAt)) / 86400000
        : null
    })
    .filter((value) => value !== null && value >= 0)

  const stageDurations = {}
  for (const item of database.items) {
    for (let index = 0; index < item.stageHistory.length - 1; index += 1) {
      const current = item.stageHistory[index]
      const next = item.stageHistory[index + 1]
      if (current.imported || next.imported) continue
      const hours =
        (new Date(next.enteredAt) - new Date(current.enteredAt)) / 3600000
      if (hours >= 0) {
        stageDurations[current.stage] ||= []
        stageDurations[current.stage].push(hours)
      }
    }
  }

  return {
    itemCount: database.items.length,
    activeCount: database.items.filter(
      (item) => !['shipped', 'archived'].includes(item.stage)
    ).length,
    soldCount: soldItems.length,
    grossCashValue: roundMoney(grossCashValue),
    revenue: roundMoney(cashRevenue),
    storeCreditValue: roundMoney(storeCreditValue),
    storeCreditRedeemed: roundMoney(storeCreditRedeemed),
    storeCreditBalance: roundMoney(storeCreditValue - storeCreditRedeemed),
    recognizedValue: roundMoney(recognizedValue),
    recognizedAdjustments: roundMoney(recognizedAdjustments),
    profit: roundMoney(recognizedValue - recognizedCosts),
    unresolvedFinancialCount: soldItems.filter(
      (item) => item.disposition?.financialStatus !== 'recognized'
    ).length,
    averageDaysToSell: sellTimes.length
      ? Math.round(
          (sellTimes.reduce((sum, value) => sum + value, 0) /
            sellTimes.length) *
            10
        ) / 10
      : null,
    turnoverRate: database.items.length
      ? Math.round((soldItems.length / database.items.length) * 1000) / 10
      : 0,
    stageCounts: Object.fromEntries(
      STAGES.map((stage) => [
        stage,
        database.items.filter((item) => item.stage === stage).length,
      ])
    ),
    averageHoursByStage: Object.fromEntries(
      Object.entries(stageDurations).map(([stage, values]) => [
        stage,
        Math.round(
          (values.reduce((sum, value) => sum + value, 0) / values.length) * 10
        ) / 10,
      ])
    ),
    researchDeploymentCount: researchDeployments.length,
    researchDeployed: roundMoney(researchDeployed),
    researchCashDeployed: roundMoney(researchCashDeployed),
    researchNonCashDeployed: roundMoney(researchNonCashDeployed),
    researchCapacityBasis: roundMoney(researchCapacityBasis),
    researchRealizedReturn: roundMoney(researchRealizedReturn),
  }
}

function createResearchDeployment(database, input, timestamp) {
  const title = String(input.title || '').trim()
  if (!title) {
    throw Object.assign(new Error('R+D deployment title is required.'), {
      status: 400,
    })
  }
  const amount = numberOrZero(input.amount)
  if (amount < 0) {
    throw Object.assign(new Error('R+D deployment basis cannot be negative.'), {
      status: 400,
    })
  }
  const deployment = {
    id: `FI-RD-${String(database.nextResearchSequence).padStart(6, '0')}`,
    deployedAt: String(input.deployedAt || ''),
    title,
    amount: roundMoney(amount),
    fundingType: String(input.fundingType || 'cash'),
    fundingSource: String(input.fundingSource || ''),
    classification: String(input.classification || 'capability-asset'),
    status: String(input.status || 'active'),
    operatingRegion: String(input.operatingRegion || ''),
    purpose: String(input.purpose || ''),
    profitPathway: String(input.profitPathway || ''),
    realizedReturn: roundMoney(numberOrZero(input.realizedReturn)),
    evidenceState: String(input.evidenceState || 'operator stated'),
    linkedTransactionGroup: String(input.linkedTransactionGroup || ''),
    notes: String(input.notes || ''),
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  database.nextResearchSequence += 1
  database.researchDeployments.unshift(deployment)
  database.audit.unshift({
    id: randomUUID(),
    itemId: deployment.id,
    action: 'research.deployment.created',
    at: timestamp,
    detail: {
      amount: deployment.amount,
      fundingType: deployment.fundingType,
      classification: deployment.classification,
    },
  })
  return deployment
}

function createItem(database, profile, input, timestamp) {
  const sequence = database.nextSequence
  database.nextSequence += 1
  const id = `FI-INV-${String(sequence).padStart(6, '0')}`
  const item = {
    id,
    profileId: profile.id,
    sku: profile.sku,
    productName: profile.name,
    stage: 'intake',
    conditionGrade: input.conditionGrade || 'ungraded',
    storageLocation: input.storageLocation || '',
    purchaseCost: numberOrZero(input.purchaseCost),
    notes: input.notes || '',
    photoStatus: 'not-started',
    photos: [],
    listing: {
      title: '',
      description: '',
      askingPrice: 0,
      salePrice: 0,
      fees: 0,
      marketplace: '',
      status: 'draft',
      url: '',
      publishedAt: '',
    },
    disposition: {
      type: '',
      channel: '',
      counterpartyRef: '',
      transactionGroup: '',
      proceedsType: '',
      value: 0,
      creditRedeemedValue: 0,
      financialStatus: 'unresolved',
      occurredAt: '',
      fulfillmentDueAt: '',
      fulfilledAt: '',
      considerationDescription: '',
      considerationStatus: '',
      adjustments: [],
    },
    shipping: {
      lengthIn: profile.shipping.lengthIn || 0,
      widthIn: profile.shipping.widthIn || 0,
      heightIn: profile.shipping.heightIn || 0,
      weightOz: profile.shipping.weightOz || 0,
      carrier: '',
      tracking: '',
      labelUrl: '',
      cost: 0,
    },
    checklists: Object.fromEntries(
      Object.entries(profile.checklists).map(([key, values]) => [
        key,
        values.map((label) => ({ label, done: false })),
      ])
    ),
    stageHistory: [{ stage: 'intake', enteredAt: timestamp }],
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  item.listing = generateListing(item, profile)
  database.items.unshift(item)
  database.audit.unshift({
    id: randomUUID(),
    itemId: id,
    action: 'item.created',
    at: timestamp,
    detail: { profileId: profile.id },
  })
  return item
}

function mergeItemPatch(item, patch, timestamp) {
  const scalarFields = [
    'conditionGrade',
    'storageLocation',
    'notes',
    'photoStatus',
  ]
  for (const field of scalarFields) {
    if (field in patch) item[field] = String(patch[field] ?? '')
  }
  if ('purchaseCost' in patch)
    item.purchaseCost = numberOrZero(patch.purchaseCost)

  if (patch.listing && typeof patch.listing === 'object') {
    const allowed = [
      'title',
      'description',
      'askingPrice',
      'salePrice',
      'fees',
      'marketplace',
      'status',
      'url',
      'publishedAt',
    ]
    for (const field of allowed) {
      if (field in patch.listing) {
        item.listing[field] = ['askingPrice', 'salePrice', 'fees'].includes(
          field
        )
          ? numberOrZero(patch.listing[field])
          : String(patch.listing[field] ?? '')
      }
    }
  }

  if (patch.shipping && typeof patch.shipping === 'object') {
    const numeric = ['lengthIn', 'widthIn', 'heightIn', 'weightOz', 'cost']
    const text = ['carrier', 'tracking', 'labelUrl']
    for (const field of numeric) {
      if (field in patch.shipping) {
        item.shipping[field] = numberOrZero(patch.shipping[field])
      }
    }
    for (const field of text) {
      if (field in patch.shipping) {
        item.shipping[field] = String(patch.shipping[field] ?? '')
      }
    }
  }

  if (patch.disposition && typeof patch.disposition === 'object') {
    const text = [
      'type',
      'channel',
      'counterpartyRef',
      'transactionGroup',
      'proceedsType',
      'financialStatus',
      'occurredAt',
      'fulfillmentDueAt',
      'fulfilledAt',
      'considerationDescription',
      'considerationStatus',
    ]
    for (const field of text) {
      if (field in patch.disposition) {
        item.disposition[field] = String(patch.disposition[field] ?? '')
      }
    }
    if ('value' in patch.disposition) {
      item.disposition.value = numberOrZero(patch.disposition.value)
    }
    if ('creditRedeemedValue' in patch.disposition) {
      item.disposition.creditRedeemedValue = numberOrZero(
        patch.disposition.creditRedeemedValue
      )
    }
    if (Array.isArray(patch.disposition.adjustments)) {
      item.disposition.adjustments = patch.disposition.adjustments.map(
        (adjustment) => ({
          type: String(adjustment?.type || 'other'),
          label: String(adjustment?.label || ''),
          amount: numberOrZero(adjustment?.amount),
          occurredAt: String(adjustment?.occurredAt || ''),
          note: String(adjustment?.note || ''),
        })
      )
    }
  }

  if (patch.checklists && typeof patch.checklists === 'object') {
    for (const [key, values] of Object.entries(patch.checklists)) {
      if (!Array.isArray(values) || !item.checklists[key]) continue
      item.checklists[key] = item.checklists[key].map((entry, index) => ({
        ...entry,
        done: Boolean(values[index]?.done),
      }))
    }
  }

  item.updatedAt = timestamp
  return item
}

function csvEscape(value) {
  const raw = String(value ?? '')
  const text =
    typeof value === 'string' && /^[=+\-@]/.test(raw) ? `'${raw}` : raw
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function createBatch(database, profile, input, timestamp) {
  const quantity = Number(input.quantity)
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 500) {
    throw Object.assign(
      new Error('Batch quantity must be between 1 and 500.'),
      {
        status: 400,
      }
    )
  }

  const transactionGroup =
    input.transactionGroup ||
    `BATCH-${timestamp.slice(0, 10)}-${randomUUID().slice(0, 8)}`
  const recognized =
    input.disposition?.financialStatus === 'recognized' &&
    Number.isFinite(Number(input.disposition?.valueTotal))
  const valueEach = recognized
    ? numberOrZero(input.disposition.valueTotal) / quantity
    : 0
  const items = []

  for (let index = 0; index < quantity; index += 1) {
    const item = createItem(
      database,
      profile,
      {
        conditionGrade: input.conditionGrade,
        notes: input.notes,
        purchaseCost: input.purchaseCostEach,
        storageLocation: input.storageLocation,
      },
      timestamp
    )
    item.listing.marketplace = input.marketplace || ''
    item.listing.status = input.listingStatus || 'draft'
    item.disposition = {
      ...item.disposition,
      type: input.disposition?.type || '',
      channel: input.disposition?.channel || input.marketplace || '',
      counterpartyRef: input.disposition?.counterpartyRef || '',
      transactionGroup,
      proceedsType: input.disposition?.proceedsType || '',
      value: roundMoney(valueEach),
      creditRedeemedValue: numberOrZero(
        input.disposition?.creditRedeemedValueEach
      ),
      financialStatus: input.disposition?.financialStatus || 'unresolved',
      occurredAt: input.disposition?.occurredAt || '',
      fulfillmentDueAt: input.disposition?.fulfillmentDueAt || '',
      fulfilledAt: input.disposition?.fulfilledAt || '',
      considerationDescription:
        input.disposition?.considerationDescription || '',
      considerationStatus: input.disposition?.considerationStatus || '',
    }
    if (input.stage && input.stage !== 'intake') {
      if (!STAGES.includes(input.stage)) {
        throw Object.assign(new Error('Unknown lifecycle stage.'), {
          status: 400,
        })
      }
      item.stage = input.stage
      item.stageHistory.push({
        stage: input.stage,
        enteredAt: timestamp,
        imported: true,
      })
    }
    item.updatedAt = timestamp
    items.push(item)
  }

  database.audit.unshift({
    id: randomUUID(),
    itemId: null,
    action: 'batch.imported',
    at: timestamp,
    detail: {
      profileId: profile.id,
      quantity,
      transactionGroup,
      itemIds: items.map((item) => item.id),
    },
  })
  return items
}

function databaseToCsv(database) {
  const headers = [
    'id',
    'sku',
    'product_name',
    'stage',
    'condition',
    'storage_location',
    'purchase_cost',
    'asking_price',
    'sale_price',
    'fees',
    'shipping_cost',
    'financial_adjustments',
    'disposition_type',
    'proceeds_type',
    'recognized_value',
    'credit_redeemed',
    'consideration_received',
    'consideration_status',
    'financial_status',
    'transaction_group',
    'marketplace',
    'listing_status',
    'carrier',
    'tracking',
    'created_at',
    'updated_at',
  ]
  const rows = database.items.map((item) => [
    item.id,
    item.sku,
    item.productName,
    item.stage,
    item.conditionGrade,
    item.storageLocation,
    item.purchaseCost,
    item.listing.askingPrice,
    item.listing.salePrice,
    item.listing.fees,
    item.shipping.cost,
    (item.disposition?.adjustments || []).reduce(
      (sum, adjustment) => sum + numberOrZero(adjustment.amount),
      0
    ),
    item.disposition?.type,
    item.disposition?.proceedsType,
    item.disposition?.value,
    item.disposition?.creditRedeemedValue,
    item.disposition?.considerationDescription,
    item.disposition?.considerationStatus,
    item.disposition?.financialStatus,
    item.disposition?.transactionGroup,
    item.listing.marketplace,
    item.listing.status,
    item.shipping.carrier,
    item.shipping.tracking,
    item.createdAt,
    item.updatedAt,
  ])
  return `${[headers, ...rows]
    .map((row) => row.map(csvEscape).join(','))
    .join('\n')}\n`
}

function readJsonBody(request, limit = 25 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    request.on('data', (chunk) => {
      size += chunk.length
      if (size > limit) {
        reject(
          Object.assign(new Error('Request body too large.'), { status: 413 })
        )
        request.destroy()
        return
      }
      chunks.push(chunk)
    })
    request.on('end', () => {
      try {
        resolve(
          chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {}
        )
      } catch {
        reject(Object.assign(new Error('Invalid JSON body.'), { status: 400 }))
      }
    })
    request.on('error', reject)
  })
}

function send(
  response,
  status,
  body,
  contentType = 'application/json; charset=utf-8'
) {
  const payload =
    contentType.startsWith('application/json') && typeof body !== 'string'
      ? `${JSON.stringify(body)}\n`
      : body
  response.writeHead(status, {
    ...securityHeaders,
    'Content-Type': contentType,
    'Content-Length': Buffer.byteLength(payload),
  })
  response.end(payload)
}

function serveFile(request, response, filePath) {
  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) {
      send(response, 404, 'Record not found.\n', 'text/plain; charset=utf-8')
      return
    }
    response.writeHead(200, {
      ...securityHeaders,
      'Content-Type':
        contentTypes[path.extname(filePath).toLowerCase()] ||
        'application/octet-stream',
      'Content-Length': stats.size,
    })
    if (request.method === 'HEAD') return response.end()
    fs.createReadStream(filePath).pipe(response)
  })
}

function createInventoryServer(options = {}) {
  const clock = options.clock || Date
  const profiles = options.profiles || loadProfiles()
  const profilesById = profileMap(profiles)
  const publicRoot = options.publicRoot || defaultPublicRoot
  const store = createStore({ dataRoot: options.dataRoot, clock })

  return http.createServer(async (request, response) => {
    try {
      if (!isAllowedHost(request.headers.host)) {
        send(
          response,
          403,
          'Loopback host required.\n',
          'text/plain; charset=utf-8'
        )
        return
      }

      const url = new URL(request.url || '/', 'http://127.0.0.1')
      const pathname = decodeURIComponent(url.pathname)
      const method = request.method || 'GET'

      if (pathname === '/api/state' && method === 'GET') {
        const database = store.read()
        send(response, 200, {
          database,
          metrics: calculateMetrics(database),
          profiles,
          stages: STAGES,
        })
        return
      }

      if (pathname === '/api/export.json' && method === 'GET') {
        send(response, 200, store.read())
        return
      }

      if (pathname === '/api/export.csv' && method === 'GET') {
        send(
          response,
          200,
          databaseToCsv(store.read()),
          'text/csv; charset=utf-8'
        )
        return
      }

      if (pathname === '/api/items' && method === 'POST') {
        const body = await readJsonBody(request)
        const profile = profilesById.get(body.profileId || profiles[0]?.id)
        if (!profile) {
          send(response, 400, { error: 'Unknown SKU profile.' })
          return
        }
        const timestamp = nowIso(clock)
        const item = await store.mutate((database) =>
          createItem(database, profile, body, timestamp)
        )
        send(response, 201, item)
        return
      }

      if (pathname === '/api/research-deployments' && method === 'POST') {
        const body = await readJsonBody(request)
        const timestamp = nowIso(clock)
        const deployment = await store.mutate((database) =>
          createResearchDeployment(database, body, timestamp)
        )
        send(response, 201, deployment)
        return
      }

      if (pathname === '/api/batches' && method === 'POST') {
        const body = await readJsonBody(request)
        const profile = profilesById.get(body.profileId || profiles[0]?.id)
        if (!profile) {
          send(response, 400, { error: 'Unknown SKU profile.' })
          return
        }
        const timestamp = nowIso(clock)
        const items = await store.mutate((database) =>
          createBatch(database, profile, body, timestamp)
        )
        send(response, 201, { items })
        return
      }

      const itemMatch = pathname.match(/^\/api\/items\/([^/]+)$/)
      if (itemMatch && method === 'PATCH') {
        const body = await readJsonBody(request)
        const timestamp = nowIso(clock)
        let updated
        await store.mutate((database) => {
          const item = database.items.find((entry) => entry.id === itemMatch[1])
          if (!item) return
          updated = mergeItemPatch(item, body, timestamp)
          database.audit.unshift({
            id: randomUUID(),
            itemId: item.id,
            action: 'item.updated',
            at: timestamp,
            detail: { fields: Object.keys(body) },
          })
        })
        if (!updated) {
          send(response, 404, { error: 'Inventory item not found.' })
          return
        }
        send(response, 200, updated)
        return
      }

      const transitionMatch = pathname.match(
        /^\/api\/items\/([^/]+)\/transition$/
      )
      if (transitionMatch && method === 'POST') {
        const body = await readJsonBody(request)
        if (!STAGES.includes(body.stage)) {
          send(response, 400, { error: 'Unknown lifecycle stage.' })
          return
        }
        const timestamp = nowIso(clock)
        let updated
        await store.mutate((database) => {
          const item = database.items.find(
            (entry) => entry.id === transitionMatch[1]
          )
          if (!item) return
          const previousStage = item.stage
          item.stage = body.stage
          item.stageHistory.push({ stage: body.stage, enteredAt: timestamp })
          item.updatedAt = timestamp
          updated = item
          database.audit.unshift({
            id: randomUUID(),
            itemId: item.id,
            action: 'stage.transitioned',
            at: timestamp,
            detail: { from: previousStage, to: body.stage },
          })
        })
        if (!updated) {
          send(response, 404, { error: 'Inventory item not found.' })
          return
        }
        send(response, 200, updated)
        return
      }

      const listingMatch = pathname.match(/^\/api\/items\/([^/]+)\/listing$/)
      if (listingMatch && method === 'POST') {
        const timestamp = nowIso(clock)
        let updated
        await store.mutate((database) => {
          const item = database.items.find(
            (entry) => entry.id === listingMatch[1]
          )
          if (!item) return
          const profile = profilesById.get(item.profileId)
          item.listing = generateListing(item, profile)
          item.updatedAt = timestamp
          updated = item
          database.audit.unshift({
            id: randomUUID(),
            itemId: item.id,
            action: 'listing.generated',
            at: timestamp,
            detail: { profileId: item.profileId },
          })
        })
        if (!updated) {
          send(response, 404, { error: 'Inventory item not found.' })
          return
        }
        send(response, 200, updated)
        return
      }

      const photoMatch = pathname.match(/^\/api\/items\/([^/]+)\/photos$/)
      if (photoMatch && method === 'POST') {
        const body = await readJsonBody(request)
        const type = String(body.type || '').toLowerCase()
        const allowedTypes = new Map([
          ['image/jpeg', '.jpg'],
          ['image/png', '.png'],
          ['image/webp', '.webp'],
          ['image/heic', '.heic'],
        ])
        const extension = allowedTypes.get(type)
        const escapedType = type.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const match = String(body.data || '').match(
          new RegExp(`^data:${escapedType};base64,(.+)$`)
        )
        if (!extension || !match) {
          send(response, 400, { error: 'Unsupported or invalid image.' })
          return
        }
        const buffer = Buffer.from(match[1], 'base64')
        if (!buffer.length || buffer.length > 20 * 1024 * 1024) {
          send(response, 400, {
            error: 'Image must be between 1 byte and 20 MB.',
          })
          return
        }
        const timestamp = nowIso(clock)
        let updated
        await store.mutate((database) => {
          const item = database.items.find(
            (entry) => entry.id === photoMatch[1]
          )
          if (!item) return
          const photoId = randomUUID()
          const itemRoot = path.join(store.uploadsRoot, item.id)
          fs.mkdirSync(itemRoot, { recursive: true, mode: 0o700 })
          const filename = `${photoId}${extension}`
          fs.writeFileSync(path.join(itemRoot, filename), buffer, {
            mode: 0o600,
          })
          item.photos.push({
            id: photoId,
            originalName: path.basename(
              String(body.name || `photo${extension}`)
            ),
            type,
            path: `${item.id}/${filename}`,
            addedAt: timestamp,
            status: body.status || 'review',
          })
          item.photoStatus = 'in-progress'
          item.updatedAt = timestamp
          updated = item
          database.audit.unshift({
            id: randomUUID(),
            itemId: item.id,
            action: 'photo.attached',
            at: timestamp,
            detail: { photoId, originalName: body.name || '' },
          })
        })
        if (!updated) {
          send(response, 404, { error: 'Inventory item not found.' })
          return
        }
        send(response, 201, updated)
        return
      }

      if (
        pathname.startsWith('/uploads/') &&
        ['GET', 'HEAD'].includes(method)
      ) {
        const relativePath = pathname.slice('/uploads'.length)
        const filePath = resolveWithin(store.uploadsRoot, relativePath)
        if (!filePath) {
          send(
            response,
            403,
            'Path outside intake.\n',
            'text/plain; charset=utf-8'
          )
          return
        }
        serveFile(request, response, filePath)
        return
      }

      if (!['GET', 'HEAD'].includes(method)) {
        send(response, 405, { error: 'Method not allowed.' })
        return
      }

      const staticPath = [
        '/',
        '/inventory',
        '/inventory/',
        '/rd',
        '/rd/',
      ].includes(pathname)
        ? '/index.html'
        : pathname
      const filePath = resolveWithin(publicRoot, staticPath)
      if (!filePath) {
        send(
          response,
          403,
          'Path outside instrument.\n',
          'text/plain; charset=utf-8'
        )
        return
      }
      serveFile(request, response, filePath)
    } catch (error) {
      send(response, error.status || 500, {
        error: error.status ? error.message : 'Operating instrument failure.',
      })
    }
  })
}

if (require.main === module) {
  const port = Number(process.env.FI_INVENTORY_PORT || 8093)
  const server = createInventoryServer()
  server.listen(port, '127.0.0.1', () => {
    console.log(`[inventaire-laboratoire] http://127.0.0.1:${port}/inventory/`)
    console.log(`[inventaire-laboratoire] http://127.0.0.1:${port}/rd/`)
    console.log(`[inventaire-laboratoire] data: ${defaultDataRoot}`)
    console.log(
      '[inventaire-laboratoire] loopback only / local operator record'
    )
  })
}

module.exports = {
  STAGES,
  calculateMetrics,
  createBatch,
  createInventoryServer,
  createResearchDeployment,
  createStore,
  databaseToCsv,
  isAllowedHost,
  resolveWithin,
}
