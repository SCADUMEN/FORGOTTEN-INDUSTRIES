// Build-time manifest of Maple Leaf Rag Zone background media. Unlike ZOOT
// (which layers a base set under the Shadow Zone overlay), this zone draws from
// the Shadow Zone ephemera ONLY (src/assets/ephemera/shadow-zone) — the same
// found-media set, surfacing and sinking one at a time. References the
// published files IN PLACE; nothing is copied.
//
// Exposed to templates as `mapleLeafRagPhotos`: { photos }, a sorted array of
// { src, kind } (kind 'image' or 'video'; see scripts/lib/shadow-zone-media.cjs
// for which files qualify and how GIFs are played). The full set is listed (no
// sampling). A missing source directory -> [] and the zone simply shows the
// slick with no photographs.

const {
  listShadowZoneMedia,
} = require('../../scripts/lib/shadow-zone-media.cjs')

module.exports = () => ({
  photos: listShadowZoneMedia(),
})
