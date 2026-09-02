// Build-time manifest of Maple Leaf Rag Zone background photographs. Unlike
// ZOOT (which layers a base set under the Shadow Zone overlay), this zone draws
// from the Shadow Zone ephemera ONLY (src/assets/ephemera/shadow-zone) — the
// same found-image set, surfacing and sinking one at a time. References the
// published photos IN PLACE; nothing is copied.
//
// Exposed to templates as `mapleLeafRagPhotos`: { photos }, a sorted array of
// { src }. The full set is listed (no sampling). A missing source directory ->
// [] and the zone simply shows the slick with no photographs. To curate: edit
// the SOURCE below.

const fs = require('fs')
const path = require('path')

// The Shadow Zone ephemera: an absolute source dir, the public URL base it maps
// to, and the filename pattern that qualifies a file.
const SOURCE = {
  dir: path.resolve(__dirname, '..', 'assets', 'ephemera', 'shadow-zone'),
  publicBase: '/assets/ephemera/shadow-zone',
  pattern: /^fi-eph-\d+.*\.jpe?g$/i,
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
  photos: listPhotos(SOURCE),
})
