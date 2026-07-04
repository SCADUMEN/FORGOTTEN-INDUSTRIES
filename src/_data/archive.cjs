const fs = require('fs')
const path = require('path')

const archivePath = path.join(
  __dirname,
  '..',
  '..',
  'dist',
  'forgotten-industries.json'
)

module.exports = function () {
  if (!fs.existsSync(archivePath)) {
    const message =
      'dist/forgotten-industries.json is missing. Run `npm run build` (or ' +
      '`npm run build:site`) so the Ruby converter regenerates it. Building ' +
      'now would produce an empty archive.'

    // Never let CI publish an empty archive silently. Locally, warn loudly but
    // still allow `eleventy --serve` to run against an empty dataset.
    if (process.env.CI) {
      throw new Error(message)
    }

    console.warn(`\n[archive] WARNING: ${message}\n`)

    return {
      meta: {},
      projects: [],
      inventory: [],
      atlasReportProvenance: {},
      fieldLogs: [],
      voiceLogs: [],
      socialPosts: [],
    }
  }

  return JSON.parse(fs.readFileSync(archivePath, 'utf8'))
}
