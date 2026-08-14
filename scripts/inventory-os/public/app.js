const app = {
  state: null,
  module: location.pathname.startsWith('/rd') ? 'laboratoire' : 'inventaire',
  stageFilter: 'all',
  selectedIndex: 0,
  activeItemId: null,
}

const $ = (selector) => document.querySelector(selector)
const moduleCopy = {
  inventaire: {
    title: "L'INVENTAIRE // Local Operator Instrument",
    heading: "L'INVENTAIRE",
    lede: 'Système des objets et des mouvements.',
  },
  laboratoire: {
    title: 'LE LABORATOIRE // Local Operator Instrument',
    heading: 'LE LABORATOIRE',
    lede: 'Système de recherche et de développement.',
  },
}
const esc = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        character
      ]
  )
const money = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(value || 0))
const date = (value) =>
  value
    ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(
        new Date(
          /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value
        )
      )
    : '—'

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const contentType = response.headers.get('content-type') || ''
  const body = contentType.includes('json')
    ? await response.json()
    : await response.text()
  if (!response.ok)
    throw new Error(body.error || body || 'Instrument request failed.')
  return body
}

function toast(message) {
  const node = $('#toast')
  node.textContent = message
  node.classList.add('visible')
  clearTimeout(toast.timer)
  toast.timer = setTimeout(() => node.classList.remove('visible'), 2400)
}

async function refresh() {
  app.state = await api('/api/state')
  render()
}

function metricCard(label, value) {
  return `<article class="metric"><span>${label}</span><strong>${value}</strong></article>`
}

function renderMetrics() {
  const metrics = app.state.metrics
  const inventoryMetrics = [
    metricCard('Registered', metrics.itemCount),
    metricCard('Active', metrics.activeCount),
    metricCard('Sales / trades', metrics.soldCount),
    metricCard('Known gross sales', money(metrics.grossCashValue)),
    metricCard('Cash revenue', money(metrics.revenue)),
    metricCard('Store credit received', money(metrics.storeCreditValue)),
    metricCard('Store credit balance', money(metrics.storeCreditBalance)),
    metricCard('Adjustments', money(metrics.recognizedAdjustments)),
    metricCard('Recognized profit', money(metrics.profit)),
    metricCard('Financial gaps', metrics.unresolvedFinancialCount),
    metricCard(
      'Average sell time',
      metrics.averageDaysToSell == null
        ? '—'
        : `${metrics.averageDaysToSell.toFixed(1)} d`
    ),
    metricCard('Turnover', `${metrics.turnoverRate.toFixed(1)}%`),
  ]
  const laboratoryMetrics = [
    metricCard('R+D deployed', money(metrics.researchDeployed)),
    metricCard('Cash deployed', money(metrics.researchCashDeployed)),
    metricCard('Non-cash deployed', money(metrics.researchNonCashDeployed)),
    metricCard('Capacity basis', money(metrics.researchCapacityBasis)),
    metricCard('Realized return', money(metrics.researchRealizedReturn)),
  ]
  $('#metrics').innerHTML = (
    app.module === 'laboratoire' ? laboratoryMetrics : inventoryMetrics
  ).join('')
}

function filteredItems() {
  const query = $('#search').value.trim().toLowerCase()
  return app.state.database.items.filter((item) => {
    const stageMatch =
      app.stageFilter === 'all' || item.stage === app.stageFilter
    const text = [
      item.id,
      item.sku,
      item.productName,
      item.conditionGrade,
      item.storageLocation,
      item.notes,
      item.listing.marketplace,
      item.disposition?.channel,
      item.disposition?.counterpartyRef,
      item.disposition?.transactionGroup,
      item.shipping.tracking,
    ]
      .join(' ')
      .toLowerCase()
    return stageMatch && (!query || text.includes(query))
  })
}

function renderStages() {
  const counts = app.state.metrics.stageCounts
  const stages = [
    { id: 'all', label: 'All records', count: app.state.metrics.itemCount },
    ...app.state.stages.map((stage) => ({
      id: stage,
      label: stage,
      count: counts[stage],
    })),
  ]
  $('#stage-nav').innerHTML = stages
    .map(
      (stage) =>
        `<button class="stage-button ${stage.id === app.stageFilter ? 'active' : ''}" data-stage="${stage.id}"><span>${stage.label}</span><b>${stage.count}</b></button>`
    )
    .join('')
  $('#stage-times').innerHTML = app.state.stages
    .map((stage) => {
      const hours = app.state.metrics.averageHoursByStage?.[stage]
      return `<div class="stage-time-row"><span>${esc(stage)}</span><output>${hours == null ? '—' : `${Number(hours).toFixed(1)} h`}</output></div>`
    })
    .join('')
  document.querySelectorAll('.stage-button').forEach((button) => {
    button.addEventListener('click', () => {
      app.stageFilter = button.dataset.stage
      app.selectedIndex = 0
      render()
    })
  })
}

function renderInventory() {
  const items = filteredItems()
  app.selectedIndex = Math.max(0, Math.min(app.selectedIndex, items.length - 1))
  $('#record-count').textContent =
    `${items.length} record${items.length === 1 ? '' : 's'}`
  $('#empty-state').hidden = items.length > 0
  $('#inventory-body').innerHTML = items
    .map(
      (
        item,
        index
      ) => `<tr data-id="${item.id}" class="${index === app.selectedIndex ? 'selected' : ''}">
        <td>${esc(item.id)}</td>
        <td>${esc(item.sku)}</td>
        <td><span class="stage-chip">${esc(item.stage)}</span></td>
        <td>${esc(item.conditionGrade)}</td>
        <td>${esc(item.storageLocation || '—')}</td>
        <td>${money(item.purchaseCost)}</td>
        <td>${item.disposition?.financialStatus === 'recognized' ? money(item.disposition.value) : 'UNRESOLVED'}</td>
        <td>${date(item.updatedAt)}</td>
      </tr>`
    )
    .join('')
  document.querySelectorAll('#inventory-body tr').forEach((row, index) => {
    row.addEventListener('click', () => {
      app.selectedIndex = index
      openItem(row.dataset.id)
    })
  })
}

function renderAudit() {
  $('#audit-log').innerHTML =
    app.state.database.audit
      .slice(0, 6)
      .map(
        (entry) =>
          `<li><strong>${esc(entry.action)}</strong>${esc(entry.itemId || 'BATCH')}<br>${date(entry.at)}</li>`
      )
      .join('') ||
    '<li><strong>NO MUTATIONS</strong>The register is quiet.</li>'
}

function renderResearch() {
  const deployments = app.state.database.researchDeployments || []
  $('#research-empty').hidden = deployments.length > 0
  $('#research-body').innerHTML = deployments
    .map(
      (deployment) => `<tr class="research-record">
        <td class="research-object-cell">
          ${deployment.photos?.[0] ? `<img class="research-thumbnail" src="/uploads/${encodeURI(deployment.photos[0].path)}" alt="Evidence thumbnail for ${esc(deployment.title)}" />` : '<span class="research-thumbnail research-thumbnail-empty">NO IMAGE</span>'}
          <span><strong>${esc(deployment.id)}</strong><br><small>${esc(deployment.catalogRef || 'Catalog reference pending')}</small></span>
        </td>
        <td>${date(deployment.deployedAt)}</td>
        <td><strong>${esc(deployment.title)}</strong><br><small>${esc(deployment.seller || 'Seller not recorded')} / ${esc(deployment.identificationConfidence || 'unresolved')}</small><br><small>${esc(deployment.profitPathway || deployment.purpose || 'No pathway recorded')}</small>${deployment.draftListing ? `<details class="listing-draft"><summary>LISTING DRAFT / ${money(deployment.draftListing.suggestedAsk)}</summary><strong>${esc(deployment.draftListing.title)}</strong><p>${esc(deployment.draftListing.description)}</p><small>${esc(deployment.draftListing.status)} / floor ${money(deployment.draftListing.floorPrice)} / ${esc(deployment.draftListing.marketplace)}</small></details>` : ''}</td>
        <td>${esc(deployment.classification)}<br><small>${esc(deployment.inventoryRole || 'research')}</small></td>
        <td>${esc(deployment.fundingType)}<br><small>${esc(deployment.fundingSource)}</small></td>
        <td>${money(deployment.amount)}</td>
        <td><span class="stage-chip">${esc(deployment.status)}</span><br><small>${esc(deployment.deliveryState || deployment.orderStatus || 'state pending')}</small></td>
        <td>${money(deployment.realizedReturn)}</td>
      </tr>`
    )
    .join('')
}

function renderSilverProgram() {
  const silverPrograms = (app.state.database.researchDeployments || []).filter(
    (deployment) => deployment.silverProfile
  )
  const panel = $('#silver-program')
  panel.hidden = app.module !== 'laboratoire' || silverPrograms.length === 0
  if (panel.hidden) return

  const metrics = app.state.metrics
  const profile = silverPrograms[0].silverProfile
  $('#silver-fine-grams').textContent =
    `${Number(metrics.researchElementalSilverGrams).toFixed(2)} g`
  $('#silver-fine-ozt').textContent =
    `${Number(metrics.researchFineSilverOzt).toFixed(2)} ozt`
  $('#silver-piece-count').textContent =
    `${metrics.researchSilverPieceCount} conditional`
  $('#silver-gross-grams').textContent =
    `${Number(metrics.researchSilverGrossGrams).toFixed(2)} g`
  $('#silver-basis').textContent = money(
    silverPrograms.reduce(
      (sum, deployment) => sum + Number(deployment.amount || 0),
      0
    )
  )
  $('#silver-verification-state').textContent = profile.verificationState
  $('#silver-boundary').textContent =
    `${profile.basisScope} ${metrics.researchSilverProvisionalPieceCount} provisional pieces are included in the working inventory estimate but excluded from the cleared basis. Receipt, authenticity, scale weight, fineness, and condition remain unverified until physical intake.`
}

function render() {
  renderMetrics()
  renderStages()
  renderInventory()
  renderResearch()
  renderSilverProgram()
  renderAudit()
}

function configureModule() {
  const copy = moduleCopy[app.module]
  document.title = copy.title
  document.body.classList.remove('module-inventaire', 'module-laboratoire')
  document.body.classList.add(`module-${app.module}`)
  $('#instrument-title').textContent = copy.heading
  $('#instrument-lede').textContent = copy.lede
  document.querySelectorAll('.module-nav a').forEach((link) => {
    const active = link.dataset.module === app.module
    if (active) link.setAttribute('aria-current', 'page')
    else link.removeAttribute('aria-current')
  })
}

function openResearchDeployment() {
  $('#research-form').reset()
  $('#research-date').value = new Intl.DateTimeFormat('en-CA').format(
    new Date()
  )
  $('#research-dialog').showModal()
  $('#research-name').focus()
}

async function createResearchDeployment(event) {
  event.preventDefault()
  const payload = {
    title: $('#research-name').value.trim(),
    deployedAt: $('#research-date').value,
    amount: $('#research-amount').value,
    fundingType: $('#research-funding-type').value,
    fundingSource: $('#research-funding-source').value.trim(),
    classification: $('#research-classification').value,
    status: $('#research-status').value,
    operatingRegion: $('#research-region').value.trim(),
    purpose: $('#research-purpose').value.trim(),
    profitPathway: $('#research-profit-pathway').value.trim(),
    evidenceState: 'operator stated',
    catalogRef: $('#research-catalog-ref').value.trim(),
    seller: $('#research-seller').value.trim(),
    orderStatus: $('#research-order-status').value.trim(),
    deliveryState: $('#research-delivery-state').value.trim(),
    identificationConfidence: $('#research-confidence').value,
    notes: $('#research-notes').value.trim(),
  }
  await api('/api/research-deployments', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  $('#research-dialog').close()
  await refresh()
  toast('R+D deployment registered')
}

function openIntake() {
  const select = $('#intake-profile')
  select.innerHTML = app.state.profiles
    .map(
      (profile) =>
        `<option value="${profile.id}">${profile.sku} — ${profile.name}</option>`
    )
    .join('')
  $('#intake-quantity').value = 1
  $('#intake-cost').value = ''
  $('#intake-location').value = ''
  $('#intake-notes').value = ''
  $('#intake-dialog').showModal()
  setTimeout(() => $('#intake-quantity').focus(), 0)
}

function activeItem() {
  return app.state.database.items.find((item) => item.id === app.activeItemId)
}

function setValue(id, value) {
  $(id).value = value ?? ''
}

function renderChecklists(item) {
  $('#checklists').innerHTML = Object.entries(item.checklists)
    .map(
      ([group, entries]) => `<div class="checklist-group" data-group="${group}">
        <h4>${group}</h4>
        ${entries
          .map(
            (entry, index) =>
              `<label><input type="checkbox" data-index="${index}" ${entry.done ? 'checked' : ''} /><span>${entry.label}</span></label>`
          )
          .join('')}
      </div>`
    )
    .join('')
}

function renderPhotos(item) {
  $('#photo-grid').innerHTML =
    item.photos
      .map(
        (photo) =>
          `<figure><img src="/uploads/${encodeURI(photo.path)}" alt="" /><figcaption>${esc(photo.originalName)}</figcaption></figure>`
      )
      .join('') || '<p class="lede">No photographs attached.</p>'
}

function openItem(id) {
  app.activeItemId = id
  const item = activeItem()
  $('#item-sku').textContent = item.sku
  $('#item-id').textContent = item.id
  $('#item-name').textContent = item.productName
  $('#edit-stage').innerHTML = app.state.stages
    .map(
      (stage) =>
        `<option ${stage === item.stage ? 'selected' : ''}>${stage}</option>`
    )
    .join('')
  setValue('#edit-grade', item.conditionGrade)
  setValue('#edit-location', item.storageLocation)
  setValue('#edit-cost', item.purchaseCost)
  setValue('#edit-notes', item.notes)
  setValue('#listing-title', item.listing.title)
  setValue('#listing-description', item.listing.description)
  setValue('#listing-marketplace', item.listing.marketplace)
  setValue('#listing-status', item.listing.status)
  setValue('#listing-asking', item.listing.askingPrice)
  setValue('#listing-sale', item.listing.salePrice)
  setValue('#listing-fees', item.listing.fees)
  setValue('#listing-url', item.listing.url)
  setValue('#disposition-type', item.disposition?.type)
  setValue('#proceeds-type', item.disposition?.proceedsType)
  setValue('#disposition-value', item.disposition?.value)
  setValue('#credit-redeemed', item.disposition?.creditRedeemedValue)
  setValue(
    '#consideration-description',
    item.disposition?.considerationDescription
  )
  setValue('#consideration-status', item.disposition?.considerationStatus)
  setValue(
    '#financial-status',
    item.disposition?.financialStatus || 'unresolved'
  )
  const adjustments = item.disposition?.adjustments || []
  $('#financial-adjustments').innerHTML = adjustments.length
    ? adjustments
        .map(
          (adjustment) =>
            `<div class="adjustment-line"><span>${esc(adjustment.label || adjustment.type)}</span><strong>−${money(adjustment.amount)}</strong></div>`
        )
        .join('')
    : '<span>None recorded</span>'
  setValue('#ship-length', item.shipping.lengthIn)
  setValue('#ship-width', item.shipping.widthIn)
  setValue('#ship-height', item.shipping.heightIn)
  setValue('#ship-weight', item.shipping.weightOz)
  setValue('#ship-carrier', item.shipping.carrier)
  setValue('#ship-tracking', item.shipping.tracking)
  setValue('#ship-cost', item.shipping.cost)
  setValue('#ship-label-url', item.shipping.labelUrl)
  renderChecklists(item)
  renderPhotos(item)
  $('#save-state').textContent = 'No unsaved changes'
  $('#item-dialog').showModal()
}

function collectChecklists(item) {
  return Object.fromEntries(
    Object.keys(item.checklists).map((group) => [
      group,
      [
        ...document.querySelectorAll(
          `.checklist-group[data-group="${group}"] input`
        ),
      ].map((input) => ({ done: input.checked })),
    ])
  )
}

function itemPatch(item) {
  return {
    conditionGrade: $('#edit-grade').value,
    storageLocation: $('#edit-location').value.trim(),
    purchaseCost: $('#edit-cost').value,
    notes: $('#edit-notes').value.trim(),
    checklists: collectChecklists(item),
    listing: {
      title: $('#listing-title').value.trim(),
      description: $('#listing-description').value.trim(),
      marketplace: $('#listing-marketplace').value.trim(),
      status: $('#listing-status').value,
      askingPrice: $('#listing-asking').value,
      salePrice: $('#listing-sale').value,
      fees: $('#listing-fees').value,
      url: $('#listing-url').value.trim(),
    },
    disposition: {
      type: $('#disposition-type').value,
      proceedsType: $('#proceeds-type').value,
      value: $('#disposition-value').value,
      creditRedeemedValue: $('#credit-redeemed').value,
      considerationDescription: $('#consideration-description').value.trim(),
      considerationStatus: $('#consideration-status').value.trim(),
      financialStatus: $('#financial-status').value,
    },
    shipping: {
      lengthIn: $('#ship-length').value,
      widthIn: $('#ship-width').value,
      heightIn: $('#ship-height').value,
      weightOz: $('#ship-weight').value,
      carrier: $('#ship-carrier').value.trim(),
      tracking: $('#ship-tracking').value.trim(),
      cost: $('#ship-cost').value,
      labelUrl: $('#ship-label-url').value.trim(),
    },
  }
}

async function saveItem() {
  const item = activeItem()
  $('#save-state').textContent = 'Writing local record…'
  await api(`/api/items/${item.id}`, {
    method: 'PATCH',
    body: JSON.stringify(itemPatch(item)),
  })
  if ($('#edit-stage').value !== item.stage) {
    await api(`/api/items/${item.id}/transition`, {
      method: 'POST',
      body: JSON.stringify({ stage: $('#edit-stage').value }),
    })
  }
  await refresh()
  $('#save-state').textContent = 'Saved'
  toast(`${item.id} saved`)
}

async function createIntake(event) {
  event.preventDefault()
  const quantity = Number($('#intake-quantity').value)
  const body = {
    profileId: $('#intake-profile').value,
    quantity,
    purchaseCostEach: $('#intake-cost').value,
    conditionGrade: $('#intake-grade').value,
    storageLocation: $('#intake-location').value.trim(),
    notes: $('#intake-notes').value.trim(),
  }
  const result = await api('/api/batches', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  $('#intake-dialog').close()
  await refresh()
  toast(
    `${result.items.length} unique record${result.items.length === 1 ? '' : 's'} created`
  )
}

async function generateListing() {
  const item = activeItem()
  await api(`/api/items/${item.id}/listing`, { method: 'POST', body: '{}' })
  await refresh()
  $('#item-dialog').close()
  openItem(item.id)
  toast('Listing copy regenerated')
}

async function attachPhotos(event) {
  const item = activeItem()
  const files = [...event.target.files]
  for (const file of files) {
    const data = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    await api(`/api/items/${item.id}/photos`, {
      method: 'POST',
      body: JSON.stringify({ name: file.name, type: file.type, data }),
    })
  }
  event.target.value = ''
  await refresh()
  renderPhotos(activeItem())
  toast(`${files.length} photograph${files.length === 1 ? '' : 's'} attached`)
}

const code39 = {
  0: 'nnnwwnwnn',
  1: 'wnnwnnnnw',
  2: 'nnwwnnnnw',
  3: 'wnwwnnnnn',
  4: 'nnnwwnnnw',
  5: 'wnnwwnnnn',
  6: 'nnwwwnnnn',
  7: 'nnnwnnwnw',
  8: 'wnnwnnwnn',
  9: 'nnwwnnwnn',
  A: 'wnnnnwnnw',
  B: 'nnwnnwnnw',
  C: 'wnwnnwnnn',
  D: 'nnnnwwnnw',
  E: 'wnnnwwnnn',
  F: 'nnwnwwnnn',
  G: 'nnnnnwwnw',
  H: 'wnnnnwwnn',
  I: 'nnwnnwwnn',
  J: 'nnnnwwwnn',
  K: 'wnnnnnnww',
  L: 'nnwnnnnww',
  M: 'wnwnnnnwn',
  N: 'nnnnwnnww',
  O: 'wnnnwnnwn',
  P: 'nnwnwnnwn',
  Q: 'nnnnnnwww',
  R: 'wnnnnnwwn',
  S: 'nnwnnnwwn',
  T: 'nnnnwnwwn',
  U: 'wwnnnnnnw',
  V: 'nwwnnnnnw',
  W: 'wwwnnnnnn',
  X: 'nwnnwnnnw',
  Y: 'wwnnwnnnn',
  Z: 'nwwnwnnnn',
  '-': 'nwnnnnwnw',
  '*': 'nwnnwnwnn',
}

function barcodeSvg(value) {
  const encoded = `*${value.toUpperCase()}*`
  let x = 4
  const bars = []
  for (const character of encoded) {
    const pattern = code39[character]
    if (!pattern) continue
    ;[...pattern].forEach((width, index) => {
      const size = width === 'w' ? 5 : 2
      if (index % 2 === 0)
        bars.push(`<rect x="${x}" y="0" width="${size}" height="42"/>`)
      x += size
    })
    x += 2
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${x + 4} 42" role="img" aria-label="Barcode ${value}">${bars.join('')}</svg>`
}

function printRecord(mode) {
  const item = activeItem()
  $('#print-id').textContent = item.id
  $('#barcode').innerHTML = barcodeSvg(item.id)
  $('#print-product').textContent = item.productName
  $('#print-location').textContent =
    item.storageLocation || 'LOCATION UNASSIGNED'
  $('#pack-id').textContent = `${item.id} // ${item.productName}`
  $('#pack-details').innerHTML = `
    <dt>Condition</dt><dd>${esc(item.conditionGrade)}</dd>
    <dt>Package</dt><dd>${item.shipping.lengthIn} × ${item.shipping.widthIn} × ${item.shipping.heightIn} in</dd>
    <dt>Weight</dt><dd>${item.shipping.weightOz} oz</dd>
    <dt>Carrier</dt><dd>${esc(item.shipping.carrier || 'UNASSIGNED')}</dd>
    <dt>Tracking</dt><dd>${esc(item.shipping.tracking || 'UNASSIGNED')}</dd>`
  $('#pack-checklist').innerHTML = (item.checklists.packing || [])
    .map((entry) => `<p>□ ${esc(entry.label)}</p>`)
    .join('')
  document.body.dataset.printMode = mode
  window.print()
  setTimeout(() => delete document.body.dataset.printMode, 100)
}

function bindEvents() {
  $('#new-research-deployment').addEventListener(
    'click',
    openResearchDeployment
  )
  $('#research-form').addEventListener('submit', createResearchDeployment)
  $('#new-item').addEventListener('click', openIntake)
  $('#empty-intake').addEventListener('click', openIntake)
  $('#intake-form').addEventListener('submit', createIntake)
  $('#search').addEventListener('input', () => {
    app.selectedIndex = 0
    renderInventory()
  })
  $('#export-csv').addEventListener('click', () => {
    window.location.href = '/api/export.csv'
  })
  $('#save-item').addEventListener('click', saveItem)
  $('#generate-listing').addEventListener('click', generateListing)
  $('#photo-input').addEventListener('change', attachPhotos)
  $('#copy-listing').addEventListener('click', async () => {
    await navigator.clipboard.writeText(
      `${$('#listing-title').value}\n\n${$('#listing-description').value}`
    )
    toast('Listing copy placed on clipboard')
  })
  $('#print-label').addEventListener('click', () => printRecord('label'))
  $('#print-pack').addEventListener('click', () => printRecord('packing'))
  document.addEventListener('keydown', (event) => {
    const dialogOpen = document.querySelector('dialog[open]')
    const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(
      document.activeElement.tagName
    )
    if (
      app.module === 'inventaire' &&
      event.key === '/' &&
      !typing &&
      !dialogOpen
    ) {
      event.preventDefault()
      $('#search').focus()
    } else if (
      app.module === 'inventaire' &&
      event.key.toLowerCase() === 'n' &&
      !typing &&
      !dialogOpen
    ) {
      openIntake()
    } else if (
      app.module === 'inventaire' &&
      !dialogOpen &&
      ['j', 'k'].includes(event.key.toLowerCase())
    ) {
      const items = filteredItems()
      app.selectedIndex = Math.max(
        0,
        Math.min(
          items.length - 1,
          app.selectedIndex + (event.key.toLowerCase() === 'j' ? 1 : -1)
        )
      )
      renderInventory()
    } else if (
      app.module === 'inventaire' &&
      event.key === 'Enter' &&
      !typing &&
      !dialogOpen
    ) {
      const item = filteredItems()[app.selectedIndex]
      if (item) openItem(item.id)
    }
  })
}

configureModule()
bindEvents()
refresh().catch((error) => {
  $('#connection-state').textContent = 'LOCAL DATA ERROR'
  toast(error.message)
})
