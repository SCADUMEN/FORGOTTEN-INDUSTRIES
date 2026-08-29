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
      atlasReports: [],
      voiceLogs: [],
      socialPosts: [],
    }
  }

  return withAtlasReportAlias(JSON.parse(fs.readFileSync(archivePath, 'utf8')))
}

// `fieldLogs` is the published schema's key for what the site calls ATLAS
// Reports, and it cannot be renamed without breaking dist/forgotten-industries
// .json for consumers reading schemaVersion 0.1.0. Templates address the same
// array as `atlasReports` so the name matches the route and the public label;
// the JSON key stays put.
function withAtlasReportAlias(archive) {
  return { ...archive, atlasReports: archive.fieldLogs || [] }
}
