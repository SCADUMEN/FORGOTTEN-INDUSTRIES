// The Shadow Zone ephemera folder as a rotation manifest, shared by the zones
// that feed on it (src/_data/zootPhotos.cjs, src/_data/mapleLeafRagPhotos.cjs)
// and by scripts/build_media_derivatives.cjs.
//
// The folder mixes stills (JPEG, PNG, WebP, AVIF), animated GIFs, and video
// clips (MP4, WebM). The zones draw each entry into a WebGL texture, which only
// ever sees a GIF's first frame, so every GIF is played through an MP4
// derivative written into motion/ by build:derivatives (gitignored). Until that
// derivative exists the GIF falls back to a still of its first frame.
//
// A `<name>-still.<ext>` beside a same-named GIF or clip is that item's poster
// frame for the object page, not a second item, so it is left out of rotation.

const fs = require('node:fs')
const path = require('node:path')

const SHADOW_ZONE_DIR = path.resolve(
  __dirname,
  '..',
  '..',
  'src',
  'assets',
  'ephemera',
  'shadow-zone'
)
const SHADOW_ZONE_PUBLIC_BASE = '/assets/ephemera/shadow-zone'
const MOTION_DIR_NAME = 'motion'

const ITEM = /^fi-eph-\d+/i
const STILL = /\.(avif|jpe?g|png|webp)$/i
const GIF = /\.gif$/i
const VIDEO = /\.(mp4|webm)$/i
const POSTER = /-still\.[^.]+$/i

function stem(file) {
  return file.replace(/\.[^.]+$/, '')
}

// MP4 derivative a GIF plays through in the zones, as a path under `dir`.
function motionDerivativeFor(dir, gifFile) {
  return path.join(dir, MOTION_DIR_NAME, `${stem(gifFile)}.mp4`)
}

// All GIF sources in the folder, sorted, as absolute paths.
function listShadowZoneGifs(dir = SHADOW_ZONE_DIR) {
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((file) => ITEM.test(file) && GIF.test(file))
    .sort((a, b) => a.localeCompare(b))
    .map((file) => path.join(dir, file))
}

// Rotation entries, sorted by filename, as { src, kind } where kind is
// 'image' (decode into an <img>) or 'video' (play in a muted, looping <video>).
// Missing dir -> [].
function listShadowZoneMedia(
  dir = SHADOW_ZONE_DIR,
  publicBase = SHADOW_ZONE_PUBLIC_BASE
) {
  if (!fs.existsSync(dir)) return []
  const files = fs
    .readdirSync(dir)
    .filter((file) => ITEM.test(file))
    .sort((a, b) => a.localeCompare(b))
  const motionStems = new Set(
    files.filter((file) => GIF.test(file) || VIDEO.test(file)).map(stem)
  )

  const entries = []
  for (const file of files) {
    if (GIF.test(file)) {
      const derivative = motionDerivativeFor(dir, file)
      entries.push(
        fs.existsSync(derivative)
          ? {
              src: `${publicBase}/${MOTION_DIR_NAME}/${path.basename(derivative)}`,
              kind: 'video',
            }
          : { src: `${publicBase}/${file}`, kind: 'image' }
      )
    } else if (VIDEO.test(file)) {
      entries.push({ src: `${publicBase}/${file}`, kind: 'video' })
    } else if (STILL.test(file)) {
      const isPoster =
        POSTER.test(file) && motionStems.has(stem(file).replace(/-still$/i, ''))
      if (!isPoster)
        entries.push({ src: `${publicBase}/${file}`, kind: 'image' })
    }
  }
  return entries
}

module.exports = {
  SHADOW_ZONE_DIR,
  SHADOW_ZONE_PUBLIC_BASE,
  listShadowZoneGifs,
  listShadowZoneMedia,
  motionDerivativeFor,
}
