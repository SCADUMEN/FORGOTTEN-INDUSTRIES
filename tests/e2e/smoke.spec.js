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
  // CxR has its own wordmark to the left of the zoot mark, not a main-nav item.
  await expect(page.locator('.site-cxr-mark')).toHaveAttribute('href', '/cxr/')
  await expect(page.locator('.site-cxr-mark')).toHaveText('CxR')
  await expect(page.locator('.primary-section-card')).toHaveCount(4)
  await expect(page.locator('.primary-card-mark')).toHaveText([
    '> The Archive',
    '> The Work',
    '> The Signal',
    '> About',
  ])
  await expect(page.locator('.instrument-strip')).toHaveCount(0)
  await expect(page.locator('.latest-activity')).toHaveCount(0)
  await expect(page.locator('.open-stacks')).toHaveCount(0)
  await expect(page.locator('.homepage-masthead .hero-mark')).toHaveAttribute(
    'aria-label',
    'Forgotten Industries logo, EST MMXIV'
  )
  await expect(page.locator('.site-footer a')).toHaveCount(4)
  await expect(page.locator('.fi-provenance-plate')).toContainText(
    "FORGOTTEN INDUSTRIES · CONTRE L'OUBLI"
  )
  // FORGOTTEN INDUSTRIES links home.
  await expect(
    page.getByRole('link', { name: 'FORGOTTEN INDUSTRIES', exact: true })
  ).toHaveAttribute('href', '/')
  await expect(page.locator('.fi-provenance-plate')).toContainText(
    'Provenance · Plan du Site · Hash'
  )
  await expect(
    page.getByRole('link', { name: 'Provenance', exact: true })
  ).toHaveAttribute('href', '/provenance/')
  await expect(
    page.locator('.site-footer a[data-track="outbound-commit"]')
  ).toHaveAttribute('href', /\/commit\/[0-9a-f]{7,}/)
  await expect(
    page.getByRole('link', { name: 'ZOOT', exact: true })
  ).toHaveAttribute('href', '/zoot/')
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
  await expect(page.locator('.homepage-masthead .hero-mark')).toBeVisible()
  await expect(page.locator('.primary-section-card')).toHaveCount(4)
  await expect(page.locator('.instrument-strip')).toHaveCount(0)
  await expect(page.locator('.latest-activity')).toHaveCount(0)
  await expect(page.locator('.open-stacks')).toHaveCount(0)
  await expect(page.locator('.site-footer a')).toHaveCount(4)
})

test('primary section pages share the global maker plate', async ({ page }) => {
  for (const route of ['/l-archive/', '/oeuvre/', '/signal/', '/apropos/']) {
    const response = await page.goto(route)
    expect(response?.status()).toBe(200)
    await expect(page.locator('.site-footer')).toBeVisible()
    await expect(page.locator('.site-footer a')).toHaveCount(4)
    await expect(page.locator('.fi-provenance-plate')).toContainText('Hash')
    await expect(
      page.getByRole('link', { name: 'Provenance', exact: true })
    ).toHaveAttribute('href', '/provenance/')
    await expect(
      page.locator('.site-footer a[data-track="outbound-commit"]')
    ).toHaveAttribute('href', /\/commit\/[0-9a-f]{7,}/)
  }
})

test('representative route families remain contained at 320px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 })

  const routes = [
    '/',
    '/l-archive/',
    '/oeuvre/',
    '/signal/',
    '/apropos/',
    '/blog/',
    '/posts/',
    '/archive/objects/fi-case-001/',
    '/hang-on-to-each-other/wrist-field-instruments/',
    '/contact.html',
    '/hash/',
    '/zoot/',
  ]

  for (const route of routes) {
    const response = await page.goto(route)
    expect(response?.status(), route).toBe(200)

    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))

    expect(dimensions.scrollWidth, route).toBe(dimensions.viewport)
  }
})

test('contact route exposes complete archive channels', async ({ page }) => {
  const response = await page.goto('/contact.html')
  expect(response?.status()).toBe(200)

  await expect(
    page.getByRole('link', {
      name: 'LESAUVEGARDER@GMAIL.COM',
      exact: true,
    })
  ).toHaveAttribute('href', 'mailto:LESAUVEGARDER@GMAIL.COM')
  await expect(
    page.getByRole('link', {
      name: 'archive@forgotten-industries.net',
      exact: true,
    })
  ).toHaveAttribute('href', 'mailto:archive@forgotten-industries.net')
  await expect(
    page.getByRole('link', {
      name: '@forgotten-industry.bsky.social',
      exact: true,
    })
  ).toHaveAttribute(
    'href',
    'https://bsky.app/profile/forgotten-industry.bsky.social'
  )
})

test('Signal and Oeuvre keep transmission and stabilized-work shelves separate', async ({
  page,
}) => {
  let response = await page.goto('/signal/')
  expect(response?.status()).toBe(200)
  await expect(page.locator('.signal-directory-grid > a')).toHaveCount(3)
  await expect(page.locator('.signal-directory-grid > a')).toHaveText([
    /LE BLOG[\s\S]*BLOG/,
    /LES DÉPOSITIONS[\s\S]*OM-882 AUDIO/,
    /EN DIRECT[\s\S]*LIVE FEED/,
  ])
  const signalCards = page.locator('.signal-directory-grid > a')
  await expect(signalCards.nth(0)).toHaveAttribute('href', '/blog/')
  await expect(signalCards.nth(1)).toHaveAttribute('href', '/field-logs/')
  await expect(signalCards.nth(2)).toHaveAttribute('href', '/en-direct/')
  await expect(page.locator('main')).not.toContainText('LES RAPPORTS')
  await expect(page.locator('main')).not.toContainText('LA PROVENANCE')

  response = await page.goto('/oeuvre/')
  expect(response?.status()).toBe(200)
  await expect(page.locator('.oeuvre-directory-grid > a')).toHaveCount(3)
  await expect(page.locator('.oeuvre-directory-grid > a')).toHaveText([
    /LES DOSSIERS/,
    /LES RAPPORTS[\s\S]*ATLAS REPORTS/,
    /LA DOCTRINE[\s\S]*SYSTEMS DOCTRINE/,
  ])
  await expect(
    page.locator('.oeuvre-directory-grid > a').nth(2)
  ).toHaveAttribute('href', '/doctrine/')

  response = await page.goto('/blog/')
  expect(response?.status()).toBe(200)
  await expect(page).toHaveTitle(/Le Blog/)
  await expect(page.locator('main')).toContainText(
    'A Thing Documented Is a Thing Not Yet Lost'
  )
  await expect(page.locator('main')).toContainText('A Way In // Le Signal Form')
  await expect(page.locator('main')).not.toContainText(
    'Short Form / Curated Entry'
  )
  await expect(page.locator('main')).not.toContainText('LE ZOOT Enters Service')
  await expect(page.locator('main')).not.toContainText(
    'Perspective, Peregrines'
  )

  response = await page.goto('/posts/')
  expect(response?.status()).toBe(200)
  await expect(page).toHaveTitle(/Les Manuscrits/)
  await expect(page.locator('main')).toContainText(
    'A Thing Documented Is a Thing Not Yet Lost'
  )
  await expect(page.locator('main')).toContainText('A Way In')
  await expect(page.locator('main')).not.toContainText(
    'A Way In // Le Signal Form'
  )
  await expect(page.locator('main')).not.toContainText('LE ZOOT Enters Service')
  await expect(page.locator('main')).not.toContainText(
    'Perspective, Peregrines'
  )

  response = await page.goto('/doctrine/')
  expect(response?.status()).toBe(200)
  await expect(page).toHaveTitle(/La Doctrine/)
  await expect(page.locator('main')).toContainText('LE ZOOT Enters Service')
  await expect(page.locator('main')).toContainText('Perspective, Peregrines')
  await expect(page.locator('main')).not.toContainText(
    'A Thing Documented Is a Thing Not Yet Lost'
  )
})

test('A Way In renders as the short application-facing route', async ({
  page,
}) => {
  const response = await page.goto('/a-way-in/')
  expect(response?.status()).toBe(200)
  await expect(page).toHaveTitle(/A Way In/)
  await expect(page.locator('main')).toContainText(
    'Short Form / Curated Entry / Entry 004'
  )
  await expect(page.locator('main')).toContainText(
    'If you found this from a resume, a cover letter, or an application link, start here.'
  )
  await expect(page.locator('main')).toContainText('A Way In // Le Signal Form')
})

test('manual shelf publishes Manual 002', async ({ page }) => {
  let response = await page.goto('/hang-on-to-each-other/')
  expect(response?.status()).toBe(200)
  await expect(
    page.getByRole('link', { name: 'Open Manual 002', exact: true })
  ).toHaveAttribute('href', '/hang-on-to-each-other/wrist-field-instruments/')

  response = await page.goto('/hang-on-to-each-other/wrist-field-instruments/')
  expect(response?.status()).toBe(200)
  await expect(page).toHaveTitle(/LE MANUEL 002/)
  await expect(page.locator('h1')).toContainText('Wrist & Field Instruments')
  await expect(page.locator('.manual-table')).toContainText('710 · Ministry')
  await expect(page.locator('.manual-roster-grid')).toContainText(
    'FI-WATCH-001'
  )
  await expect(page.locator('.manual-doctrine')).toContainText(
    "D'en haut, les choses se souviennent les unes des autres."
  )
})

test('archive page renders', async ({ page }) => {
  const response = await page.goto('/l-archive/')
  expect(response?.status()).toBe(200)
  await expect(page).toHaveTitle(/L'Archive/)
  await expect(page.locator('meta[name="format-detection"]')).toHaveAttribute(
    'content',
    'telephone=no'
  )

  const wideCounters = page.locator('.branch-stats .stat-wide')
  await expect(wideCounters).toHaveCount(2)
  await expect(wideCounters).toHaveText([/Objects catalogued/, /Git commits?/])
  await expect(page.locator('.branch-stats .stat-adjustment')).toHaveText([
    /Live canonical inventory/,
    /[+−]?\d+/,
  ])
  await expect(page.locator('.archive-curator-note')).toContainText(
    'Records may be incomplete, uncertain, or awaiting verification. Uncertainty is preserved rather than removed.'
  )
  await expect(page.locator('.archive-search-band')).toContainText(
    "Rechercher L'Archive"
  )
  await expect(page.locator('.archive-search-band')).toContainText(
    'Search the Archive'
  )
  await expect(page.locator('.archive-finding-aid')).toContainText(
    'Recovered Social Records'
  )
  await expect(page.locator('.archive-finding-aid')).toContainText(
    'Registered Shelves'
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
  await expect(page.locator('#archive-search-status')).toContainText(
    /\d+ unique indexed records \/ \d+ public routes \/ ready/
  )

  await page.getByRole('searchbox', { name: "Search L'Archive" }).fill('Pang')
  await expect(page.locator('#archive-search-results')).toContainText('Pang')

  const galleryObjectLinks = page.locator(
    '.inventory-gallery-track figcaption a[href^="/archive/objects/"]'
  )
  const visibleGalleryObjectLinks = page.locator(
    '.inventory-gallery-card:visible figcaption a[href^="/archive/objects/"]'
  )
  const galleryTrack = page.locator('.inventory-gallery-track')
  const declaredGalleryTotal = Number(
    await page
      .locator('.inventory-gallery-track')
      .getAttribute('data-gallery-total')
  )
  const galleryCountControl = page.getByRole('slider', {
    name: 'Sample aperture',
  })

  expect(declaredGalleryTotal).toBeGreaterThan(8)
  await expect(galleryObjectLinks).toHaveCount(declaredGalleryTotal)
  await expect(visibleGalleryObjectLinks).toHaveCount(8)
  await expect(galleryTrack).toHaveAttribute('data-gallery-count', '8')
  await expect(galleryTrack).toHaveAttribute('data-gallery-randomized', 'true')
  await expect(galleryCountControl).toHaveValue('8')
  await expect(page.locator('[data-inventory-gallery-stress]')).toHaveAttribute(
    'data-stress-level',
    'nominal'
  )

  await galleryCountControl.fill(String(declaredGalleryTotal))
  await expect(visibleGalleryObjectLinks).toHaveCount(declaredGalleryTotal)
  await expect(galleryTrack).toHaveAttribute(
    'data-gallery-count',
    String(declaredGalleryTotal)
  )
  await expect(page.locator('[data-inventory-gallery-stress]')).toContainText(
    '100% / RASTER SATURATED'
  )
  await expect(page.locator('[data-inventory-gallery-stress]')).toHaveAttribute(
    'data-stress-level',
    'critical'
  )
})

test('archive container register keeps witness and filter states aligned', async ({
  page,
}) => {
  const response = await page.goto('/l-archive/')
  expect(response?.status()).toBe(200)

  const observation = page.locator('#archive-container-observation')
  const c0 = page.locator('[data-clearance="C0"]')
  const c1 = page.locator('[data-clearance="C1"]')
  const c2 = page.locator('[data-clearance="C2"]')
  const box000 = page.locator('[data-box-id="LE-BOX-000"]')
  const box002 = page.locator('[data-box-id="LE-BOX-002"]')
  const box006 = page.locator('[data-box-id="LE-BOX-006"]')
  const box010 = page.locator('[data-box-id="LE-BOX-010"]')
  const filter = page.locator('#archive-container-filter-input')

  await expect(page.locator('[data-photo-caption]')).toHaveText(
    'Physical-state visual witness'
  )

  await c2.click()
  await expect(c0).toHaveAttribute('aria-pressed', 'true')
  await expect(c2).toHaveAttribute('aria-pressed', 'false')
  await expect(page.locator('#archive-clearance-status')).toHaveText(
    'C2 / local operator register unavailable'
  )
  await expect(observation).toHaveAttribute('data-clearance-view', 'C0')

  await box002.click()
  await c1.click()
  await expect(page.locator('[data-detail-evidence]')).toHaveText(
    'Labelled multi-box image held'
  )
  await expect(page.locator('[data-photo-caption]')).toHaveText(
    'Physical-state visual witness'
  )

  await box006.click()
  await filter.fill('LE-BOX-010')
  await expect(page.locator('[data-box-list-item]:visible')).toHaveCount(1)
  await expect(box006).toHaveAttribute('aria-expanded', 'false')
  await expect(box010).toHaveAttribute('aria-expanded', 'true')
  await expect(
    page.locator('#archive-container-observation-heading')
  ).toHaveText('LE-BOX-010')

  await filter.fill('no-such-record')
  await expect(page.locator('[data-box-list-item]:visible')).toHaveCount(0)
  await expect(observation).toBeHidden()

  await filter.fill('')
  await expect(page.locator('[data-box-list-item]:visible')).toHaveCount(26)
  await expect(observation).toBeVisible()
  await expect(box000).toHaveAttribute('aria-expanded', 'true')
})

test('archive page remains contained and uses an intentional object shelf on mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 852 })
  const response = await page.goto('/l-archive/')
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
  await expect(page.locator('.object-thumbnail-strip a')).toHaveCount(17)
  await expect(
    page.locator('.object-thumbnail-strip a[aria-current="true"]')
  ).toHaveCount(1)
  await expect(page.locator('.object-metadata-grid dt')).toHaveText([
    'Identity',
    'Dossier',
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
    'https://forgotten-industries.net/assets/forgotten-industries.png'
  )
})

test('archive compatibility route contains a real archive link', async ({
  request,
}) => {
  const response = await request.get('/archive.html', { maxRedirects: 0 })
  expect(response.status()).toBe(200)
  const body = await response.text()
  expect(body).toContain('<a href="/l-archive/">/l-archive/</a>')
  expect(body).not.toContain('&lt;/archive/&gt;')
  expect(body).not.toContain('</archive/>')
  expect(body).not.toContain('The preserved record now lives at /archive/')
})

test('inventory compatibility routes resolve to generated inventory', async ({
  page,
  request,
}) => {
  const legacyResponse = await request.get('/inventory.html', {
    maxRedirects: 0,
  })
  expect(legacyResponse.status()).toBe(200)
  const legacyBody = await legacyResponse.text()
  expect(legacyBody).toContain('href="/archive/inventory/"')
  expect(legacyBody).not.toContain('<h2>Core Items</h2>')

  const response = await page.goto('/inventory/')
  expect(response?.status()).toBe(200)
  await page.waitForURL('**/archive/inventory/')
  await expect(page).toHaveTitle(/Inventory/)
  await expect(
    page.locator('a[href="/archive/objects/fi-cl-part-010/"]')
  ).toHaveCount(1)
})

test('posts index lists Les Manuscrits', async ({ page }) => {
  let response = await page.goto('/posts/')
  expect(response?.status()).toBe(200)
  await expect(page).toHaveTitle(/Les Manuscrits/)
  await expect(page.locator('a[href^="/posts/2026"]')).toHaveCount(2)
  await expect(page.locator('main')).toContainText(
    "The Machinations of Time / L'Horologist"
  )
  await expect(page.locator('main')).not.toContainText('LE ZOOT Enters Service')

  response = await page.goto('/doctrine/')
  expect(response?.status()).toBe(200)
  await expect(page.locator('a[href^="/posts/2026"]')).toHaveCount(3)
  await expect(page.locator('main')).toContainText('LE ZOOT Enters Service')
  await expect(page.locator('main')).toContainText(
    'The Yellow-Crowned Night Heron'
  )
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
  const response = await page.goto('/l-archive/?q=FI-CL')
  expect(response?.status()).toBe(200)
  await expect(page.locator('#archive-search-status')).toHaveText('11 results')
  await expect(page.locator('#archive-search-results > li')).toHaveCount(11)
  await expect(page.locator('#archive-search-results')).toContainText(
    'L’ARCHIVE / CaseLabs Mercury S8 Restoration'
  )
})

test('restoration dossiers preserve canonical identity and public custody boundaries', async ({
  page,
  request,
}) => {
  const response = await page.goto('/projects/')
  expect(response?.status()).toBe(200)

  const x99Card = page.locator('a[href="/projects/x99-impact-recovery/"]')
  await expect(x99Card).toContainText('LE RÉDEMPTEURE / X99 Recovery Dossier')
  await expect(x99Card).toContainText('Function unverified')
  await expect(x99Card).not.toContainText('Two platforms')

  const larchiveCard = page.locator('a[href="/projects/caselabs-mercury-s8/"]')
  await expect(larchiveCard).toContainText(
    'L’ARCHIVE / CaseLabs Mercury S8 Restoration'
  )
  await expect(larchiveCard).toContainText(
    'LE RÉDEMPTEURE, the boutique hardline-cooled X99 main cube'
  )
  await expect(larchiveCard).toContainText(
    'LE SAUVEGARDER, the preservation and storage-array pedestal'
  )

  const sourceResponse = await request.get(
    '/projects/x99-impact-recovery/README.md'
  )
  expect(sourceResponse.status()).toBe(200)
  const sourceBody = await sourceResponse.text()
  expect(sourceBody).toContain('The broader container register remains local.')
  expect(sourceBody).not.toContain('25 ammo cans')
  expect(sourceBody).not.toContain('Garage storage')
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

test('human-readable sitemap page lists grouped links', async ({ page }) => {
  const response = await page.goto('/plan-du-site/')
  expect(response.status()).toBe(200)
  await expect(
    page.getByRole('heading', { name: 'Plan du Site' })
  ).toBeVisible()
  await expect(page.locator('.sitemap-group')).not.toHaveCount(0)
  await expect(page.locator('.sitemap-tree .node-link').first()).toBeVisible()
  // Nested lists prove the directory hierarchy renders, not a flat list.
  await expect(
    page.locator('.sitemap-tree-list .sitemap-tree-list').first()
  ).toBeVisible()
})

test('/sitemap/ redirects to the canonical /plan-du-site/', async ({
  page,
}) => {
  await page.goto('/sitemap/')
  await page.waitForURL('**/plan-du-site/')
  await expect(
    page.getByRole('heading', { name: 'Plan du Site' })
  ).toBeVisible()
})
