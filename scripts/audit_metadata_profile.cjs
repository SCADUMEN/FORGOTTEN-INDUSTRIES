#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const archivePath = path.join(root, 'dist', 'forgotten-industries.json')
const searchPath = path.join(root, 'dist', 'search-index.json')
const processDir = path.join(root, 'src', 'docs', 'process')
const processMarkdownPath = path.join(
  processDir,
  '2026-07-13-metadata-profile-sweep.md'
)
const processJsonPath = path.join(
  processDir,
  '2026-07-13-metadata-profile-sweep.json'
)
const writeReport = process.argv.includes('--write')

const reviewFields = [
  'record_type',
  'public_layer',
  'access',
  'public_clearance',
  'sensitivity',
  'redaction_status',
  'certainty',
  'sha256',
  'hash_algorithm',
  'manifest_hash',
  'preservation_events',
  'custodial_history',
  'scope_and_content',
]

function readJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) return fallback
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function compact(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
}

function uniqueSorted(values) {
  return [...new Set(values.map(compact).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  )
}

function countField(records, field) {
  return records.filter((record) => {
    const value = record?.[field]
    if (Array.isArray(value)) return value.length > 0
    return value !== undefined && value !== null && String(value).trim() !== ''
  }).length
}

function listFields(records) {
  const fields = new Set()
  for (const record of records) {
    if (!record || typeof record !== 'object') continue
    for (const field of Object.keys(record)) fields.add(field)
  }
  return [...fields].sort((a, b) => a.localeCompare(b))
}

function printCoverage(label, records, fields) {
  console.log(`\n${label}`)
  console.log(`records: ${records.length}`)
  for (const field of fields) {
    const count = countField(records, field)
    const pct = records.length ? Math.round((count / records.length) * 100) : 0
    console.log(`  ${field}: ${count}/${records.length} (${pct}%)`)
  }
}

function fieldCoverage(records, fields) {
  return fields.map((field) => {
    const count = countField(records, field)
    const percent = records.length
      ? Math.round((count / records.length) * 100)
      : 0
    return {
      field,
      count,
      total: records.length,
      percent,
    }
  })
}

function markdownList(values) {
  if (!values.length) return '- none'
  return values.map((value) => `- ${value}`).join('\n')
}

function markdownCoverageRows(rows) {
  return rows
    .map(
      (row) => `| ${row.field} | ${row.count}/${row.total} | ${row.percent}% |`
    )
    .join('\n')
}

function markdownFamilySection(family) {
  return [
    `### ${family.label}`,
    '',
    `Records: ${family.recordCount}`,
    '',
    '| Field | Coverage | Percent |',
    '| --- | --- | --- |',
    markdownCoverageRows(family.coverage),
    '',
    'Fields present:',
    '',
    markdownList(family.fieldsPresent),
  ].join('\n')
}

function writeSweepReport(report) {
  fs.mkdirSync(processDir, { recursive: true })

  const markdown = [
    '# Metadata Profile Sweep',
    '',
    'Status: first-pass standards and taxonomy sweep',
    '',
    'Authority: Matthew Taylor Marx / Forgotten Industries',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    'Profile: `src/docs/metadata-profile-v0.1.md`',
    '',
    '## Scope',
    '',
    'This sweep records the current standards-alignment state of the public archive bundle. It is a baseline, not a record migration.',
    '',
    'No private intake material is public-cleared by this report.',
    '',
    '## Archive Bundle',
    '',
    `- Schema version: ${report.schemaVersion}`,
    `- Generated archive timestamp: ${report.archiveGeneratedAt}`,
    `- Canonical records counted: ${report.totals.canonicalRecords}`,
    `- Search/index records counted: ${report.totals.indexRecords}`,
    '',
    '## Immediate Standards',
    '',
    '- Dublin Core Metadata Terms: descriptive metadata',
    '- DACS: archival description practice',
    '- PREMIS: preservation metadata and fixity',
    '- W3C PROV-O: provenance chains',
    '',
    '## Second-Pass Target',
    '',
    'Use Records in Contexts / RiC-O as the graph-capable target after the local FI profile stabilizes.',
    '',
    '## Record Family Coverage',
    '',
    ...report.families.flatMap((family) => [markdownFamilySection(family), '']),
    '## Browse Taxonomy',
    '',
    `- Categories: ${report.taxonomy.categories.length}`,
    `- Status terms: ${report.taxonomy.status.length}`,
    `- Systems: ${report.taxonomy.systems.length}`,
    `- Tags: ${report.taxonomy.tags.length}`,
    '',
    '### Categories',
    '',
    markdownList(report.taxonomy.categories),
    '',
    '### Status Terms',
    '',
    markdownList(report.taxonomy.status),
    '',
    '### Systems',
    '',
    markdownList(report.taxonomy.systems),
    '',
    '### Tags',
    '',
    markdownList(report.taxonomy.tags),
    '',
    '## Standards-Alignment Gaps',
    '',
    '| Field | Coverage | Percent |',
    '| --- | --- | --- |',
    markdownCoverageRows(report.reviewFieldCoverage),
    '',
    '## Interpretation',
    '',
    '- Core descriptive fields are strong across current canonical records.',
    '- Browse taxonomy is large and should be normalized before being treated as a controlled vocabulary.',
    '- Access, public clearance, sensitivity, certainty, fixity, and preservation events are the priority fields for the first data migration.',
    '- The second pass should add RiC-O-ready relation language after these local controls exist.',
    '',
  ].join('\n')

  fs.writeFileSync(processMarkdownPath, `${markdown}\n`)
  fs.writeFileSync(processJsonPath, `${JSON.stringify(report, null, 2)}\n`)
}

const archive = readJson(archivePath)
if (!archive) {
  console.error(
    'Missing dist/forgotten-industries.json. Run `npm run build:site` or `npm run build` first.'
  )
  process.exit(1)
}

const searchIndex = readJson(searchPath, { documents: [] })
const documents = Array.isArray(searchIndex.documents)
  ? searchIndex.documents
  : []

const families = [
  {
    label: 'Dossiers / projects',
    records: archive.projects || [],
    fields: ['id', 'slug', 'title', 'category', 'status', 'summary'],
  },
  {
    label: 'Inventory / objects',
    records: archive.inventory || [],
    fields: [
      'id',
      'name',
      'category',
      'condition',
      'status',
      'date_logged',
      'associated_project',
    ],
  },
  {
    label: 'Field logs',
    records: archive.fieldLogs || [],
    fields: [
      'id',
      'slug',
      'title',
      'date',
      'timestamp',
      'category',
      'status',
      'source_path',
    ],
  },
  {
    label: 'Voice logs',
    records: archive.voiceLogs || [],
    fields: ['id', 'title', 'date', 'recorded_at', 'recorder', 'audio'],
  },
  {
    label: 'Social evidence',
    records: archive.socialPosts || [],
    fields: [
      'id',
      'source',
      'source_id',
      'source_url',
      'title',
      'date',
      'post_path',
    ],
  },
]

const familiesWithCoverage = families.map((family) => ({
  label: family.label,
  recordCount: family.records.length,
  records: family.records,
  fieldsPresent: listFields(family.records),
  coverage: fieldCoverage(family.records, family.fields),
}))

console.log('Forgotten Industries metadata profile audit')
console.log(`schemaVersion: ${archive.schemaVersion || 'unknown'}`)
console.log(`generatedAt: ${archive.generatedAt || 'unknown'}`)

for (const family of familiesWithCoverage) {
  printCoverage(
    family.label,
    family.records,
    family.coverage.map((row) => row.field)
  )
}

const allCanonicalRecords = families.flatMap((family) => family.records)

console.log('\nField inventory')
for (const family of familiesWithCoverage) {
  console.log(`  ${family.label}: ${family.fieldsPresent.join(', ')}`)
}

const categories = uniqueSorted(documents.map((record) => record.category))
const statuses = uniqueSorted(documents.map((record) => record.status))
const systems = uniqueSorted(documents.map((record) => record.system))
const tags = uniqueSorted(
  documents.flatMap((record) => (Array.isArray(record.tags) ? record.tags : []))
)

console.log('\nBrowse vocabulary inventory')
console.log(`  categories: ${categories.length}`)
console.log(`  status terms: ${statuses.length}`)
console.log(`  systems: ${systems.length}`)
console.log(`  tags: ${tags.length}`)

console.log('\nStandards-alignment gaps to review')
for (const field of reviewFields) {
  const count = countField(allCanonicalRecords, field)
  console.log(`  ${field}: ${count}/${allCanonicalRecords.length}`)
}

console.log('\nSecond-pass target')
console.log(
  '  Keep FI public taxonomy stable; add controlled fields before attempting RiC-O/RDF export.'
)

const report = {
  id: 'FI-METADATA-SWEEP-2026-07-13',
  title: 'Metadata Profile Sweep',
  generatedAt: new Date().toISOString(),
  schemaVersion: archive.schemaVersion || 'unknown',
  archiveGeneratedAt: archive.generatedAt || 'unknown',
  profile: 'src/docs/metadata-profile-v0.1.md',
  sourceFiles: archive.meta?.sourceFiles || [],
  totals: {
    canonicalRecords: allCanonicalRecords.length,
    indexRecords: documents.length,
  },
  families: familiesWithCoverage.map((family) => ({
    label: family.label,
    recordCount: family.recordCount,
    fieldsPresent: family.fieldsPresent,
    coverage: family.coverage,
  })),
  taxonomy: {
    categories,
    status: statuses,
    systems,
    tags,
  },
  reviewFieldCoverage: fieldCoverage(allCanonicalRecords, reviewFields),
  secondPassTarget: {
    standard: 'Records in Contexts / RiC-O',
    rule: 'Add controlled FI fields before attempting RiC-O/RDF export.',
  },
}

if (writeReport) {
  writeSweepReport(report)
  console.log(`\nWrote ${path.relative(root, processMarkdownPath)}`)
  console.log(`Wrote ${path.relative(root, processJsonPath)}`)
}
