// Build-time manifest of ZOOT background media. References already-published
// sets IN PLACE — nothing is copied. Two layers feed the ZOOT film:
//   base    — the full Matthew Marx photo set (src/assets/initial-photos), the
//             main rotation that holds and cross-fades one at a time.
//   overlay — the Shadow Zone ephemera (src/assets/ephemera/shadow-zone), a
//             second layer that cross-fades continuously on top so one found
//             image or clip is always mid-transition.
//
// Exposed to templates as `zootPhotos`: { base, overlay }, each a sorted array
// of { src, kind } (kind 'image' or 'video'). The full sets are listed (no
// sampling) since the credit line was retired. A missing source directory -> []
// and that layer no-ops (ZOOT is visually unchanged for it). The overlay's
// qualifying files are defined in scripts/lib/shadow-zone-media.cjs; to curate
// the base, edit BASE below.

const fs = require('fs')
const path = require('path')
const {
  listShadowZoneMedia,
} = require('../../scripts/lib/shadow-zone-media.cjs')

const BASE = {
  dir: path.resolve(__dirname, '..', 'assets', 'initial-photos'),
  publicBase: '/assets/initial-photos',
  pattern: /^matthewmarx-\d+\.jpe?g$/i,
}

// All qualifying files in a directory, sorted, as { src, kind }. Missing dir -> [].
function listPhotos({ dir, publicBase, pattern }) {
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((file) => pattern.test(file))
    .sort((a, b) => a.localeCompare(b))
    .map((file) => ({ src: `${publicBase}/${file}`, kind: 'image' }))
}

module.exports = () => ({
  base: listPhotos(BASE),
  overlay: listShadowZoneMedia(),
})
