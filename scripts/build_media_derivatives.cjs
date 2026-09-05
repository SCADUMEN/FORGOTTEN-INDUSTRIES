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

const REPO = path.join(__dirname, '..')

// Preserved sources and the derivatives each one should have beside it.
const REMUX_SOURCES = [
  'src/assets/initial-photos/matthewmarx-071.mov',
  'src/assets/initial-photos/matthewmarx-115.mov',
]

const GIF_SOURCES = [
  'src/assets/reference/hang-on-to-each-other/caselabs-mercury-s8/caselabs-mercury-s8-assembly-timelapse-cpachris-ocn.gif',
]

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

main()
