import { expect, test } from '@playwright/test'

// Exercises the CxR (CONTINUANCExRESEARCH) React app built into _site/cxr/.
// Verifies the two-column surface, cross-source search, the cross-reference
// panel, and that source/query selections persist to localStorage across
// reloads.

test('CxR app renders two columns and loads sources', async ({ page }) => {
  const response = await page.goto('/cxr/')
  expect(response?.status()).toBe(200)

  await expect(page.locator('.continuance-masthead h1')).toHaveText(
    'CONTINUANCExRESEARCH'
  )

  const columns = page.locator('.continuance-column')
  await expect(columns).toHaveCount(2)

  // The FI source is present in both column pickers.
  const optionsA = columns.nth(0).locator('select option')
  await expect(
    optionsA.filter({ hasText: 'Forgotten Industries' })
  ).toHaveCount(1)
})

test('search returns results in both columns and cross-references a selection', async ({
  page,
}) => {
  await page.goto('/cxr/')
  const columns = page.locator('.continuance-column')

  // Point both columns at the populated FI source so cross-referencing has data
  // on each side.
  await columns.nth(0).locator('select').selectOption('fi')
  await columns.nth(1).locator('select').selectOption('fi')

  await page.locator('.continuance-search-field input').fill('archive')

  const resultsA = columns.nth(0).locator('.continuance-result')
  const resultsB = columns.nth(1).locator('.continuance-result')
  await expect(resultsA.first()).toBeVisible()
  expect(await resultsA.count()).toBeGreaterThan(0)
  expect(await resultsB.count()).toBeGreaterThan(0)

  // Selecting a result promotes it as the cross-reference anchor.
  const anchorTitle = await resultsA
    .first()
    .locator('.continuance-result-title')
    .innerText()
  await resultsA.first().click()

  const crossref = page.locator('.continuance-crossref')
  await expect(crossref).not.toHaveClass(/is-empty/)
  await expect(
    crossref.locator('.continuance-crossref-anchor-title')
  ).toHaveText(anchorTitle)
  await expect(crossref).toContainText('RELATED IN')
  // The anchor's own record must never appear among its related records.
  await expect(crossref.locator('.continuance-crossref-list')).toBeVisible()
})

test('source and query selections persist across reload', async ({ page }) => {
  await page.goto('/cxr/')
  const columns = page.locator('.continuance-column')

  await columns.nth(1).locator('select').selectOption('fi')
  await page.locator('.continuance-search-field input').fill('lighthouse')

  await page.reload()

  await expect(page.locator('.continuance-search-field input')).toHaveValue(
    'lighthouse'
  )
  await expect(columns.nth(1).locator('select')).toHaveValue('fi')
})

test('bookmarks save, persist, restore, and remove a cross-reference', async ({
  page,
}) => {
  await page.goto('/cxr/')
  const columns = page.locator('.continuance-column')

  await columns.nth(0).locator('select').selectOption('fi')
  await columns.nth(1).locator('select').selectOption('fi')
  await page.locator('.continuance-search-field input').fill('archive')

  // Anchor a result in column A, then bookmark that cross-reference.
  const resultsA = columns.nth(0).locator('.continuance-result')
  await expect(resultsA.first()).toBeVisible()
  const anchorTitle = await resultsA
    .first()
    .locator('.continuance-result-title')
    .innerText()
  await resultsA.first().click()

  const saveButton = page.locator('.continuance-bookmark-save')
  await expect(saveButton).toHaveText('Bookmark')
  await saveButton.click()
  await expect(saveButton).toHaveText('Saved')

  const chip = page.locator('.continuance-bookmark')
  await expect(chip).toHaveCount(1)
  await expect(chip.locator('.continuance-bookmark-title')).toHaveText(
    anchorTitle
  )

  // The bookmark outlives a reload (the anchor itself does not persist).
  await page.reload()
  await expect(page.locator('.continuance-bookmark')).toHaveCount(1)
  await expect(page.locator('.continuance-crossref')).toHaveClass(/is-empty/)

  // Perturb state, then restore: sources, query, and anchor all come back.
  await columns.nth(1).locator('select').selectOption('nor')
  await page.locator('.continuance-search-field input').fill('unrelated-xyz')
  await page.locator('.continuance-bookmark-open').first().click()

  await expect(columns.nth(1).locator('select')).toHaveValue('fi')
  await expect(page.locator('.continuance-search-field input')).toHaveValue(
    'archive'
  )
  const crossref = page.locator('.continuance-crossref')
  await expect(crossref).not.toHaveClass(/is-empty/)
  await expect(
    crossref.locator('.continuance-crossref-anchor-title')
  ).toHaveText(anchorTitle)
  // The restored cross-reference is recognized as already bookmarked.
  await expect(page.locator('.continuance-bookmark-save')).toHaveText('Saved')

  // Removing the chip clears it.
  await page.locator('.continuance-bookmark-remove').first().click()
  await expect(page.locator('.continuance-bookmark')).toHaveCount(0)
})

test('selecting the URL source reveals a URL entry field', async ({ page }) => {
  await page.goto('/cxr/')
  const columnA = page.locator('.continuance-column').nth(0)

  // No URL field until the URL source is chosen.
  await expect(columnA.locator('.continuance-url-entry')).toHaveCount(0)

  await columnA.locator('select').selectOption('__url__')
  const field = columnA.locator('.continuance-url-entry input')
  await expect(field).toBeVisible()
  await expect(columnA.locator('.continuance-url-entry button')).toHaveText(
    'Load'
  )

  // The selection persists across reload (an empty URL simply loads nothing).
  await page.reload()
  await expect(columnA.locator('select')).toHaveValue('__url__')
  await expect(columnA.locator('.continuance-url-entry input')).toBeVisible()
})

test('both dossiers (persona + CxR) expand inline', async ({ page }) => {
  await page.goto('/cxr/')
  const dossiers = page.locator('.continuance-dossier')
  await expect(dossiers).toHaveCount(2)

  // First: the CONTINUANCE persona dossier.
  const persona = dossiers.nth(0)
  await expect(persona.locator('summary')).toHaveText('The CONTINUANCE dossier')
  await expect(persona.locator('.continuance-dossier-body')).toBeHidden()
  await persona.locator('summary').click()
  await expect(persona.locator('.continuance-dossier-body')).toBeVisible()
  await expect(persona).toContainText('Keep moving')
  await expect(persona).toContainText('The work continues')

  // Second: the CxR (tool) dossier.
  const cxr = dossiers.nth(1)
  await expect(cxr.locator('summary')).toHaveText('The CxR dossier')
  await cxr.locator('summary').click()
  await expect(cxr.locator('.continuance-dossier-body')).toBeVisible()
  await expect(cxr).toContainText('cross-referencing archive sources')
})

test('dossier route documents the persona and links the instrument', async ({
  page,
}) => {
  const response = await page.goto('/projects/continuance/')
  expect(response?.status()).toBe(200)
  await expect(page).toHaveTitle(/CONTINUANCE/)
  await expect(page.locator('h1')).toContainText('CONTINUANCE')
  await expect(page.locator('main')).toContainText('The work continues')
  await expect(
    page.getByRole('link', {
      name: 'Open CxR — the CONTINUANCE research instrument',
    })
  ).toHaveAttribute('href', '/cxr/')
})
