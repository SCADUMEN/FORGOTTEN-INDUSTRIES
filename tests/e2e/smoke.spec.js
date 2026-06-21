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
  await expect(page.locator('.primary-card-mark')).toHaveText([
    '// Archive //',
    '// Work //',
    '// Signal //',
    '// About //',
  ])
  const homepageStats = page.locator('.homepage-instrument-stats .stat')
  await expect(homepageStats).toHaveCount(5)
  await expect(homepageStats).toHaveText([
    /Projects/,
    /Manuels/,
    /ATLAS Reports/,
    /Build Checks/,
    /Git Commits/,
  ])
  await expect(page.locator('.homepage-masthead .hero-image')).toHaveAttribute(
    'src',
    '/assets/forgotten-industries.jpeg'
  )
  await expect(page.locator('.site-footer a')).toHaveCount(1)
  await expect(
    page.getByRole('link', { name: 'Provenance', exact: true })
  ).toHaveAttribute('href', '/provenance/')
})

test('home page remains contained on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 })
  const response = await page.goto('/')
  expect(response?.status()).toBe(200)

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))

  expect(dimensions.scrollWidth).toBe(dimensions.viewport)
  await expect(page.locator('.homepage-masthead .hero-image')).toBeVisible()
  await expect(page.locator('.primary-section-card')).toHaveCount(4)
  await expect(page.locator('.homepage-instrument-stats .stat')).toHaveCount(5)
  await expect(page.locator('.site-footer a')).toHaveCount(1)
})

test('primary section pages share the global maker plate', async ({ page }) => {
  for (const route of ['/archive/', '/oeuvre/', '/signal/', '/apropos/']) {
    const response = await page.goto(route)
    expect(response?.status()).toBe(200)
    await expect(page.locator('.site-footer')).toBeVisible()
    await expect(page.locator('.site-footer a')).toHaveCount(1)
    await expect(
      page.getByRole('link', { name: 'Provenance', exact: true })
    ).toHaveAttribute('href', '/provenance/')
  }
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
  await expect(wideCounters).toHaveText([/Objects catalogued/, /Git commits/])
  await expect(page.locator('.branch-stats .stat-adjustment')).toHaveText([
    /Live canonical inventory/,
    /[+−]?\d+/,
  ])
  await expect(page.locator('.archive-curator-note')).toContainText(
    "L'Archive preserves uncertainty rather than removes it."
  )
  await expect(page.locator('.archive-curator-note')).toContainText(
    'A thing not documented is a thing already lost.'
  )
  await expect(page.locator('.archive-search-band')).toContainText(
    'Archives are searched.'
  )
  await expect(page.locator('.archive-aerial-plate')).toContainText(
    'Context recovered from altitude.'
  )
  await expect(page.locator('.archive-aerial-plate')).toHaveAttribute(
    'href',
    '/archive/aerial-documentation/'
  )
  await expect(page.locator('.archive-finding-aid')).toContainText(
    'Recovered Social Records'
  )
  await expect(page.locator('.archive-finding-aid')).toContainText(
    'Archive Shelves'
  )
  await expect(page.locator('.archive-finding-aid')).not.toContainText(
    'The Preserved Record'
  )

  const gallery = page.locator('.inventory-gallery-viewport')
  await expect(gallery).toBeVisible()
  await expect(gallery).toHaveAttribute('tabindex', '0')
  await expect(page.locator('.inventory-gallery-track')).toHaveCSS(
    'grid-template-columns',
    /.+/
  )

  await page.getByRole('searchbox', { name: "Search L'Archive" }).fill('Pang')
  await expect(page.locator('#archive-search-results')).toContainText('Pang')

  await expect(
    page.locator('a[href="/forgotten-industries/l-archive/caselabs-s8/"]')
  ).toContainText('CaseLabs Mercury S8')
})

test('archive page remains contained and uses an intentional object shelf on mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 852 })
  const response = await page.goto('/archive/')
  expect(response?.status()).toBe(200)

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    galleryScrollWidth: document.querySelector('.inventory-gallery-viewport')
      ?.scrollWidth,
    galleryClientWidth: document.querySelector('.inventory-gallery-viewport')
      ?.clientWidth,
  }))

  expect(dimensions.scrollWidth).toBe(dimensions.viewport)
  expect(dimensions.galleryScrollWidth).toBeGreaterThan(
    dimensions.galleryClientWidth
  )
  await expect(page.locator('.inventory-gallery-viewport')).toHaveCSS(
    'overflow-x',
    'auto'
  )
})

test('object records render image-first museum entries and social images', async ({
  page,
}) => {
  const response = await page.goto('/archive/objects/fi-case-001/')
  expect(response?.status()).toBe(200)

  const primaryImage = page.locator('.object-primary-figure img')
  await expect(primaryImage).toBeVisible()
  await expect(primaryImage).toHaveAttribute(
    'src',
    '/assets/initial-photos/matthewmarx-046.jpeg'
  )
  await expect(primaryImage).toHaveAttribute(
    'alt',
    'FI-CASE-001 — CaseLabs Mercury S8'
  )
  await expect(page.locator('.object-thumbnail-strip a')).toHaveCount(16)
  await expect(page.locator('.object-metadata-grid dt')).toHaveText([
    'Identity',
    'Project',
    'Condition',
    'Status',
    'Disposition',
    'Build relevance',
  ])

  const layout = await page.evaluate(() => ({
    imageBottom: document
      .querySelector('.object-visual-band')
      ?.getBoundingClientRect().bottom,
    metadataTop: document
      .querySelector('.object-metadata-band')
      ?.getBoundingClientRect().top,
  }))
  expect(layout.metadataTop).toBeGreaterThanOrEqual(layout.imageBottom)

  await expect(
    page.locator('.object-source-assets details')
  ).not.toHaveAttribute('open', '')
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    'https://forgotten-industries.net/assets/initial-photos/matthewmarx-046.jpeg'
  )
})

test('object records without photographs show a restrained placeholder', async ({
  page,
}) => {
  const response = await page.goto('/archive/objects/fi-ped-001/')
  expect(response?.status()).toBe(200)
  await expect(page.locator('.object-image-placeholder')).toContainText(
    'No image available'
  )
  await expect(page.locator('.object-primary-figure')).toHaveCount(0)
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    'https://forgotten-industries.net/assets/forgotten-industries.jpeg'
  )
})

test('archive compatibility route contains a real archive link', async ({
  request,
}) => {
  const response = await request.get('/archive.html', { maxRedirects: 0 })
  expect(response.status()).toBe(200)
  const body = await response.text()
  expect(body).toContain('<a href="/archive/">/archive/</a>')
  expect(body).not.toContain('&lt;/archive/&gt;')
  expect(body).not.toContain('</archive/>')
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
