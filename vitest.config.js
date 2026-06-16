import { defineConfig } from 'vitest/config'

// Unit tests only. Playwright owns tests/e2e, so it is excluded here.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.js'],
    exclude: ['tests/e2e/**', 'node_modules/**', '_site/**', 'dist/**'],
  },
})
