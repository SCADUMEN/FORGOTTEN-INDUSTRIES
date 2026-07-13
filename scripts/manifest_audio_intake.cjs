const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const repoRoot = path.resolve(__dirname, '..')
const args = process.argv.slice(2)

function argValue(name) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : undefined
}

const root = path.resolve(repoRoot, argValue('--root') || 'intake')
const batchDate = argValue('--date')
const writePath = argValue('--write')
const transcriptRoot = argValue('--transcript-root')
  ? path.resolve(repoRoot, argValue('--transcript-root'))
  : batchDate
    ? path.join(root, '_transcripts', batchDate)
    : null

function prefixForDate(dateString) {
  const match = /^20(\d{2})-(\d{2})-(\d{2})$/.exec(dateString || '')
  if (!match) return undefined
  return `${match[1]}${match[2]}${match[3]}`
}

function sha256File(filePath) {
  return crypto
    .createHash('sha256')
    .update(fs.readFileSync(filePath))
    .digest('hex')
}

function ffprobe(filePath) {
  const result = spawnSync(
    'ffprobe',
    [
      '-v',
      'error',
      '-show_entries',
      'format=duration,format_name:stream=codec_name,codec_type,sample_rate,channels',
      '-of',
      'json',
      filePath,
    ],
    { encoding: 'utf8' }
  )

  if (result.status !== 0) {
    return {
      error: (result.stderr || result.stdout || 'ffprobe failed').trim(),
    }
  }

  return JSON.parse(result.stdout)
}

function audioFiles() {
  const datePrefix = prefixForDate(batchDate)
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => /\.(wav|mp3|m4a|aiff|aif)$/i.test(name))
    .filter((name) => !datePrefix || name.startsWith(datePrefix))
    .sort((a, b) => a.localeCompare(b))
}

const records = audioFiles().map((name, index) => {
  const filePath = path.join(root, name)
  const stats = fs.statSync(filePath)
  const probe = ffprobe(filePath)
  const audioStream = Array.isArray(probe.streams)
    ? probe.streams.find((stream) => stream.codec_type === 'audio')
    : undefined
  const sequenceMatch = /_(\d+)\./.exec(name)
  const transcriptPath = transcriptRoot
    ? path.join(transcriptRoot, `${path.parse(name).name}.json`)
    : null
  const hasTranscript = transcriptPath ? fs.existsSync(transcriptPath) : false

  return {
    sequence: sequenceMatch ? Number(sequenceMatch[1]) : index + 1,
    file: path.relative(repoRoot, filePath).replaceAll(path.sep, '/'),
    bytes: stats.size,
    sha256: sha256File(filePath),
    modified_at_utc: stats.mtime.toISOString(),
    duration_seconds: probe.format?.duration
      ? Number(Number(probe.format.duration).toFixed(3))
      : null,
    format: probe.format?.format_name || null,
    codec: audioStream?.codec_name || null,
    sample_rate_hz: audioStream?.sample_rate
      ? Number(audioStream.sample_rate)
      : null,
    channels: audioStream?.channels || null,
    transcription_status: hasTranscript ? 'complete' : 'pending',
    transcript_file: hasTranscript
      ? path.relative(repoRoot, transcriptPath).replaceAll(path.sep, '/')
      : null,
  }
})

const manifest = {
  schema: 'forgotten-industries.voice-intake-manifest.v0.1',
  batch_date: batchDate || null,
  generated_at_utc: new Date().toISOString(),
  intake_root: path.relative(repoRoot, root).replaceAll(path.sep, '/'),
  record_count: records.length,
  total_duration_seconds: Number(
    records
      .reduce((total, record) => total + (record.duration_seconds || 0), 0)
      .toFixed(3)
  ),
  records,
}

const output = `${JSON.stringify(manifest, null, 2)}\n`

if (writePath) {
  const absoluteWritePath = path.resolve(repoRoot, writePath)
  fs.mkdirSync(path.dirname(absoluteWritePath), { recursive: true })
  fs.writeFileSync(absoluteWritePath, output, 'utf8')
  console.log(path.relative(repoRoot, absoluteWritePath))
} else {
  process.stdout.write(output)
}
