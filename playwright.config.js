import { defineConfig, devices } from '@playwright/test'

// Smoke tests run against the already-built static site in _site/. Run
// `npm run build:site` first (CI does this before test:e2e). The webServer
// serves _site over http-server so no application server is needed.
const PORT = 4321

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npx http-server _site -p ${PORT} --silent`,
    url: `http://127.0.0.1:${PORT}`,
    timeout: 60_000,
    reuseExistingServer: !process.env.CI,
  },
})
