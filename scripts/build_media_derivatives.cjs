#!/usr/bin/env node
'use strict'

// Write web-playable derivatives beside preserved source media.
//
// Two source formats in the archive do not play in a browser the way a reader
// expects:
//
//   * QuickTime .mov from a phone. The streams inside are already H.264 video
//     and AAC audio, so the derivative is a container remux with `-c copy` —
//     no re-encode, no generation loss. It also drops the Apple `mebx`
//     metadata tracks, which are exactly the kind of thing the repository's
//     location-metadata policy exists to keep out of published media.
//   * Animated .gif used as a reference clip. These are re-encoded, because
//     there is no lossless path from GIF to video, and the saving is large
//     (a 5 MB GIF becomes well under 1 MB).
//
// It also writes enlarged link-preview JPEGs for object stills too narrow for
// Messages to show (see buildLinkPreviews).
//
// Source files are never modified or deleted. Pages prefer the derivative and
// keep the original as a fallback <source>, so the record still points at the
// file the archive holds.
//
// Usage: node scripts/build_media_derivatives.cjs [--check]
//   --check reports what is missing or stale and exits non-zero, without
//           writing anything.

const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const ffmpeg = require('ffmpeg-static')
const sharp = require('sharp')
const yaml = require('js-yaml')
const {
  LINK_PREVIEW_DIR,
  LINK_PREVIEW_MIN_WIDTH,
  LINK_PREVIEW_WIDTH,
  linkPreviewDerivative,
  linkPreviewPhoto,
} = require('./lib/object-media.cjs')
const {
  SHADOW_ZONE_DIR,
  listShadowZoneGifs,
  motionDerivativeFor,
} = require('./lib/shadow-zone-media.cjs')

const REPO = path.join(__dirname, '..')

// Preserved sources and the derivatives each one should have beside it.
const REMUX_SOURCES = [
  'src/assets/initial-photos/matthewmarx-071.mov',
  'src/assets/initial-photos/matthewmarx-115.mov',
]

const GIF_SOURCES = [
  'src/assets/reference/hang-on-to-each-other/caselabs-mercury-s8/caselabs-mercury-s8-assembly-timelapse-cpachris-ocn.gif',
]

// Every Shadow Zone GIF also gets an MP4 in shadow-zone/motion/, which is what
// the zones' WebGL rotation plays (a texture only sees a GIF's first frame).
// MP4 only: the rotation needs one format every browser decodes, and object
// pages show the GIF itself in an <img>.
const SHADOW_ZONE_GIF_SOURCES = listShadowZoneGifs().map((source) => ({
  source: path.relative(REPO, source),
  output: path.relative(
    REPO,
    motionDerivativeFor(SHADOW_ZONE_DIR, path.basename(source))
  ),
}))

function run(args) {
  execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
    stdio: 'inherit',
  })
}

function swap(file, extension) {
  return file.replace(/\.[^.]+$/, `.${extension}`)
}

function megabytes(file) {
  return (fs.statSync(file).size / 1048576).toFixed(2)
}

function main() {
  const check = process.argv.includes('--check')
  const missing = []
  const written = []

  const expected = [
    ...REMUX_SOURCES.map((source) => ({
      source,
      outputs: [swap(source, 'mp4')],
      kind: 'remux',
    })),
    ...GIF_SOURCES.map((source) => ({
      source,
      outputs: [swap(source, 'mp4'), swap(source, 'webm')],
      kind: 'gif',
    })),
    ...SHADOW_ZONE_GIF_SOURCES.map(({ source, output }) => ({
      source,
      outputs: [output],
      kind: 'gif',
    })),
  ]

  for (const entry of expected) {
    const sourcePath = path.join(REPO, entry.source)
    if (!fs.existsSync(sourcePath)) {
      console.error(`Missing preserved source: ${entry.source}`)
      process.exitCode = 1
      return
    }

    for (const output of entry.outputs) {
      const outputPath = path.join(REPO, output)
      const stale =
        !fs.existsSync(outputPath) ||
        fs.statSync(outputPath).mtimeMs < fs.statSync(sourcePath).mtimeMs

      if (!stale) continue
      if (check) {
        missing.push(output)
        continue
      }
      fs.mkdirSync(path.dirname(outputPath), { recursive: true })

      if (entry.kind === 'remux') {
        // Copy the existing H.264/AAC streams into MP4; faststart moves the
        // index to the front so the clip can start before it finishes loading.
        run([
          '-i',
          sourcePath,
          '-map',
          '0:v:0',
          '-map',
          '0:a:0?',
          '-c',
          'copy',
          '-movflags',
          '+faststart',
          outputPath,
        ])
      } else if (output.endsWith('.mp4')) {
        run([
          '-i',
          sourcePath,
          '-movflags',
          '+faststart',
          '-pix_fmt',
          'yuv420p',
          // H.264 requires even dimensions.
          '-vf',
          'scale=trunc(iw/2)*2:trunc(ih/2)*2',
          '-c:v',
          'libx264',
          '-crf',
          '23',
          '-preset',
          'slow',
          outputPath,
        ])
      } else {
        run([
          '-i',
          sourcePath,
          '-c:v',
          'libvpx-vp9',
          '-crf',
          '34',
          '-b:v',
          '0',
          '-row-mt',
          '1',
          outputPath,
        ])
      }

      written.push(output)
      console.log(`  ${output}  ${megabytes(outputPath)} MB`)
    }
  }

  if (check) {
    if (missing.length) {
      console.error(
        `Media derivatives missing or stale:\n  ${missing.join('\n  ')}\n` +
          `Run: node scripts/build_media_derivatives.cjs`
      )
      process.exitCode = 1
      return
    }
    console.log('All media derivatives present and newer than their sources.')
    return
  }

  console.log(
    written.length
      ? `\nWrote ${written.length} derivative(s).`
      : 'All derivatives already current.'
  )
}

// Enlarged link-preview images. An inventory object's preview still (see
// linkPreviewPhoto) narrower than LINK_PREVIEW_MIN_WIDTH is skipped by Messages,
// so it gets a LINK_PREVIEW_WIDTH JPEG copy under src/assets/previews/
// (gitignored), which og:image then points at. A GIF with no poster is taken a
// third of the way in, the frame the Shadow Zone records were described from.
// The previews folder holds only what the current inventory needs.
async function buildLinkPreviews(check) {
  const expected = new Map() // output -> source, both repo-relative
  const items =
    yaml.load(
      fs.readFileSync(path.join(REPO, 'src/data/inventory.yml'), 'utf8')
    )?.items || []

  for (const item of items) {
    const photo = linkPreviewPhoto(item)
    if (!photo) continue
    const source = path.join('src', photo)
    if (!fs.existsSync(path.join(REPO, source))) continue
    const { width } = await sharp(path.join(REPO, source)).metadata()
    if (!width || width >= LINK_PREVIEW_MIN_WIDTH) continue
    expected.set(path.join('src', linkPreviewDerivative(photo)), source)
  }

  const stale = []
  for (const [output, source] of expected) {
    const outputPath = path.join(REPO, output)
    const sourcePath = path.join(REPO, source)
    if (
      fs.existsSync(outputPath) &&
      fs.statSync(outputPath).mtimeMs >= fs.statSync(sourcePath).mtimeMs
    ) {
      continue
    }
    stale.push(output)
    if (check) continue

    const { pages = 1 } = await sharp(sourcePath).metadata()
    fs.mkdirSync(path.dirname(outputPath), { recursive: true })
    await sharp(sourcePath, { page: Math.floor(pages / 3) })
      .resize({ width: LINK_PREVIEW_WIDTH, kernel: 'lanczos3' })
      .flatten({ background: '#000000' })
      .jpeg({ quality: 90 })
      .toFile(outputPath)
    console.log(`  ${output}`)
  }

  const previewRoot = path.join(REPO, 'src', LINK_PREVIEW_DIR)
  const orphans = fs.existsSync(previewRoot)
    ? fs
        .readdirSync(previewRoot, { recursive: true })
        .map((file) => path.join('src', LINK_PREVIEW_DIR, file))
        .filter(
          (file) =>
            fs.statSync(path.join(REPO, file)).isFile() && !expected.has(file)
        )
    : []

  if (check) {
    if (stale.length || orphans.length) {
      console.error(
        `Link previews missing, stale, or orphaned:\n  ${[...stale, ...orphans].join('\n  ')}\n` +
          `Run: node scripts/build_media_derivatives.cjs`
      )
      process.exitCode = 1
      return
    }
    console.log(`All ${expected.size} link preview(s) present and current.`)
    return
  }

  for (const orphan of orphans) fs.rmSync(path.join(REPO, orphan))
  console.log(
    `Link previews: ${expected.size} needed, ${stale.length} written, ${orphans.length} removed.`
  )
}

main()
buildLinkPreviews(process.argv.includes('--check')).catch((error) => {
  console.error(error)
  process.exitCode = 1
})
