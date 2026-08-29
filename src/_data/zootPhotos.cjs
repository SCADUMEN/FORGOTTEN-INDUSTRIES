// Build-time manifest of ZOOT background photographs. References already-published
// photo sets IN PLACE — nothing is copied. Two layers feed the ZOOT film:
//   base    — the full Matthew Marx photo set (src/assets/initial-photos), the
//             main rotation that holds and cross-fades one at a time.
//   overlay — the Shadow Zone ephemera (src/assets/ephemera/shadow-zone), a
//             second layer that cross-fades continuously on top so one found
//             image is always mid-transition.
//
// Exposed to templates as `zootPhotos`: { base, overlay }, each a sorted array
// of { src }. The full sets are listed (no sampling) since the credit line was
// retired. A missing source directory -> [] and that layer no-ops (ZOOT is
// visually unchanged for it). To curate: edit the SOURCES table below.

const fs = require('fs')
const path = require('path')

// Each layer: an absolute source dir, the public URL base it maps to, and the
// filename pattern that qualifies a file.
const SOURCES = {
  base: {
    dir: path.resolve(__dirname, '..', 'assets', 'initial-photos'),
    publicBase: '/assets/initial-photos',
    pattern: /^matthewmarx-\d+\.jpe?g$/i,
  },
  overlay: {
    dir: path.resolve(__dirname, '..', 'assets', 'ephemera', 'shadow-zone'),
    publicBase: '/assets/ephemera/shadow-zone',
    pattern: /^fi-eph-\d+.*\.jpe?g$/i,
  },
}

// All qualifying files in a directory, sorted, as { src }. Missing dir -> [].
function listPhotos({ dir, publicBase, pattern }) {
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((file) => pattern.test(file))
    .sort((a, b) => a.localeCompare(b))
    .map((file) => ({ src: `${publicBase}/${file}` }))
}

module.exports = () => ({
  base: listPhotos(SOURCES.base),
  overlay: listPhotos(SOURCES.overlay),
})
