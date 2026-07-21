const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const repoRoot = path.resolve(__dirname, '..')
const defaultRoot = path.join(repoRoot, 'intake', 'LE-BOX-001-012')
const args = process.argv.slice(2)
const write = args.includes('--write')
const rootArg = args.find((arg) => !arg.startsWith('--'))
const intakeRoot = path.resolve(repoRoot, rootArg || defaultRoot)

const includedTopLevel = new Set([
  'protocol-v0.1-larchive-protocol.md',
  'cataloguing-register.yml',
  'box-ledger.yml',
  'capacity-model.yml',
  'ledger-verification-2026-07-12.yml',
  'photo-intake-log.md',
  'position-map.yml',
  'provisional-object-ledger.yml',
])
const includedDirs = new Set(['manifests', 'raw', 'derivatives'])
const ignoredNames = new Set(['.DS_Store'])

function sha256File(filePath) {
  return crypto
    .createHash('sha256')
    .update(fs.readFileSync(filePath))
    .digest('hex')
}

function walk(dir) {
  if (!fs.existsSync(dir)) return []

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)
    if (ignoredNames.has(entry.name)) return []
    if (entry.isDirectory()) return walk(fullPath)
    if (!entry.isFile()) return []
    if (entry.name === 'README.md') return []
    return [fullPath]
  })
}

function intakeFiles() {
  const topLevel = fs
    .readdirSync(intakeRoot, { withFileTypes: true })
    .flatMap((entry) => {
      const fullPath = path.join(intakeRoot, entry.name)
      if (entry.isFile() && includedTopLevel.has(entry.name)) return [fullPath]
      if (entry.isDirectory() && includedDirs.has(entry.name))
        return walk(fullPath)
      return []
    })

  return topLevel.sort((a, b) => a.localeCompare(b))
}

if (!fs.existsSync(intakeRoot)) {
  console.error(`Intake root not found: ${intakeRoot}`)
  process.exit(1)
}

const records = intakeFiles().map((filePath) => {
  const relativePath = path
    .relative(intakeRoot, filePath)
    .replaceAll(path.sep, '/')
  return {
    path: relativePath,
    sha256: sha256File(filePath),
  }
})

const sumLines = records.map((record) => `${record.sha256}  ${record.path}`)
const combinedInput = `${sumLines.join('\n')}\n`
const combinedSha256 = crypto
  .createHash('sha256')
  .update(combinedInput, 'utf8')
  .digest('hex')

console.log(sumLines.join('\n'))
console.log(`\ncombined_sha256  ${combinedSha256}`)

if (write) {
  const hashDir = path.join(intakeRoot, 'hashes')
  fs.mkdirSync(hashDir, { recursive: true })
  fs.writeFileSync(path.join(hashDir, 'SHA256SUMS.txt'), combinedInput, 'utf8')
  fs.writeFileSync(
    path.join(hashDir, 'hash-report.json'),
    `${JSON.stringify(
      {
        protocol: "v0.1 - L'Archive Protocol",
        generated_at_utc: new Date().toISOString(),
        intake_root: path
          .relative(repoRoot, intakeRoot)
          .replaceAll(path.sep, '/'),
        combined_sha256: combinedSha256,
        records,
      },
      null,
      2
    )}\n`,
    'utf8'
  )
}
