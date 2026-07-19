// Build-time manifest of ZOOT background photographs. References the archive's
// already-published photo set IN PLACE (src/assets/initial-photos, served at
// /assets/initial-photos/*) — nothing is copied. An evenly-spaced sample keeps
// the bottom "BACKGROUND PHOTOS:" credit line short while still drifting across
// the set; the ZOOT film cross-fades through whatever is listed here.
//
// Exposed to templates as `zootPhotos`: a sorted array of { src, label }.
// The credit link points at the file itself; the label is the humanized
// filename. To curate: change SOURCE_DIR / PHOTO / SAMPLE below. An empty or
// missing source -> [] and the feature no-ops (ZOOT looks unchanged).

const fs = require('fs')
const path = require('path')

const SOURCE_DIR = path.resolve(__dirname, '..', 'assets', 'initial-photos')
const PUBLIC_BASE = '/assets/initial-photos'
const PHOTO = /^matthewmarx-\d+\.jpe?g$/i
const SAMPLE = 8 // keep the credit line small; raise for a denser rotation

// "matthewmarx-004.jpeg" -> "Matthewmarx 004"
function humanize(file) {
  return path
    .basename(file, path.extname(file))
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// Deterministic evenly-spaced pick (no Math.random — builds stay reproducible).
function evenSample(items, count) {
  if (items.length <= count) return items
  const step = items.length / count
  const out = []
  for (let i = 0; i < count; i++) out.push(items[Math.floor(i * step)])
  return out
}

module.exports = () => {
  if (!fs.existsSync(SOURCE_DIR)) return []

  const files = fs
    .readdirSync(SOURCE_DIR)
    .filter((file) => PHOTO.test(file))
    .sort((a, b) => a.localeCompare(b))

  return evenSample(files, SAMPLE).map((file) => ({
    src: `${PUBLIC_BASE}/${file}`,
    label: humanize(file),
  }))
}
