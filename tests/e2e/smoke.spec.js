import { expect, test } from '@playwright/test'

// Smoke tests against the built static site (_site). They assert key routes
// return 200 and render the expected content. No live network or app server.

test('home page renders', async ({ page }) => {
  const response = await page.goto('/')
  expect(response?.status()).toBe(200)
  await expect(page).toHaveTitle('Forgotten Industries')
  await expect(page.locator('h1')).toContainText('Forgotten Industries')
  await expect(page.locator('.site-nav a')).toHaveText([
    "L'ARCHIVE",
    "L'ŒUVRE",
    'LE SIGNAL',
    'À PROPOS',
  ])
  await expect(page.locator('.primary-section-card')).toHaveCount(4)
  await expect(page.locator('.homepage-instrument-stats .stat')).toHaveCount(5)
  await expect(
    page.getByRole('link', { name: 'Provenance', exact: true })
  ).toHaveAttribute('href', '/provenance/')
})

test('archive page renders', async ({ page }) => {
  const response = await page.goto('/archive/')
  expect(response?.status()).toBe(200)
  await expect(page).toHaveTitle(/L'Archive/)

  const socialLedger = page.getByRole('list', {
    name: 'Scrollable recovered social evidence ledger',
  })
  await expect(socialLedger).toBeVisible()
  await expect(socialLedger).toHaveCSS('overflow-y', 'auto')
  await expect(socialLedger).toHaveAttribute('tabindex', '0')

  const wideCounters = page.locator('.branch-stats .stat-wide')
  await expect(wideCounters).toHaveCount(2)
  await expect(wideCounters).toHaveText([/Source files/, /Git commits/])
  await expect(page.locator('.branch-stats .stat-adjustment')).toHaveText([
    /[+−]?\d+/,
    /[+−]?\d+/,
  ])
  await expect(
    page.locator('a[href="/forgotten-industries/l-archive/caselabs-s8/"]')
  ).toContainText('CaseLabs Mercury S8')
})

test('posts index lists the curated posts', async ({ page }) => {
  const response = await page.goto('/posts/')
  expect(response?.status()).toBe(200)
  await expect(page).toHaveTitle(/Essays \/ Posts/)
  // Both dated curated posts should be linked from the index.
  await expect(page.locator('a[href^="/posts/2026"]')).toHaveCount(2)
})

test('En Direct lands on the imported signal', async ({ page }) => {
  const response = await page.goto('/en-direct/')
  expect(response?.status()).toBe(200)
  await expect(
    page.getByRole('heading', {
      name: 'Latest dispatches from the live channel.',
      level: 2,
    })
  ).toBeVisible()
  await expect(page.locator('a[href="/field-notes/"]')).toContainText(
    'Open all imported dispatches'
  )
})

test('CaseLabs object archive renders with records and photographs', async ({
  page,
  request,
}) => {
  const response = await page.goto(
    '/forgotten-industries/l-archive/caselabs-s8/'
  )
  expect(response?.status()).toBe(200)
  await expect(page).toHaveTitle(/CaseLabs Mercury S8/)
  await expect(page.locator('.archive-gallery img')).toHaveCount(10)

  const objectResponse = await request.get(
    '/forgotten-industries/l-archive/caselabs-s8/fi-cl-part-001-8x-hdd-pedestal-mount/'
  )
  expect(objectResponse.status()).toBe(200)

  const imageResponse = await request.get(
    '/forgotten-industries/l-archive/caselabs-s8/assets/representative-photos/fi-cl-part-001.jpg'
  )
  expect(imageResponse.status()).toBe(200)
  expect(imageResponse.headers()['content-type']).toContain('image/jpeg')
})

test('CaseLabs intake objects are searchable canonical inventory', async ({
  page,
}) => {
  const response = await page.goto('/archive/?q=FI-CL')
  expect(response?.status()).toBe(200)
  await expect(page.locator('#archive-search-status')).toHaveText('10 results')
  await expect(page.locator('#archive-search-results > li')).toHaveCount(10)
  await expect(
    page.locator('.inventory-gallery-card').filter({ hasText: 'FI-CL-PART-' })
  ).toHaveCount(10)
})

test('Atom feed is served as XML with entries', async ({ request }) => {
  const response = await request.get('/feed.xml')
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toContain('xml')
  const body = await response.text()
  expect(body).toContain('<feed')
  expect(body).toContain('<entry>')
})

test('sitemap is valid XML with url entries', async ({ request }) => {
  const response = await request.get('/sitemap.xml')
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toContain('xml')
  const body = await response.text()
  expect(body).toContain('<urlset')
  expect(body).toContain('<loc>')
})
