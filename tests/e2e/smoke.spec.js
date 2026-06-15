import { expect, test } from '@playwright/test'

// Smoke tests against the built static site (_site). They assert key routes
// return 200 and render the expected content. No live network or app server.

test('home page renders', async ({ page }) => {
  const response = await page.goto('/')
  expect(response?.status()).toBe(200)
  await expect(page).toHaveTitle('Forgotten Industries')
  await expect(page.locator('h1')).toContainText('Forgotten Industries')
})

test('archive page renders', async ({ page }) => {
  const response = await page.goto('/archive.html')
  expect(response?.status()).toBe(200)
  await expect(page).toHaveTitle(/L'Archive/)
})

test('posts index lists the curated posts', async ({ page }) => {
  const response = await page.goto('/posts/')
  expect(response?.status()).toBe(200)
  await expect(page).toHaveTitle(/Le Signal/)
  // Both dated curated posts should be linked from the index.
  await expect(page.locator('a[href^="/posts/2026"]')).toHaveCount(2)
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
