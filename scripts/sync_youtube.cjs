#!/usr/bin/env node
'use strict'

// Copies the Forgotten Industries YouTube uploads into src/_data/youtube.json so
// the unified Atom feed (/feed.xml) and the site can list them. Run by hand
// after posting a video; the site build never calls it.
//
// Why a committed file and not a build step: YouTube's public channel feed is
// unreliable (it alternates 404 / 500 / 200 for the same URL within seconds),
// and a build that depends on it would fail at random in CI. So the feed is
// read here, with retries, and the result ships as data.
//
// YouTube's feed only lists the latest 15 uploads. Entries already in the JSON
// are kept when they fall off the feed, so the file becomes the full history.
// To remove a video that was deleted or made private, delete its entry from
// the JSON by hand.
//
// Usage: node scripts/sync_youtube.cjs   (or: npm run sync:youtube)

const fs = require('node:fs')
const path = require('node:path')

const CHANNEL_ID = 'UCgcR4nmGKKfbDd87IWFY5tQ'
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`
const OUTPUT = path.join(__dirname, '..', 'src', '_data', 'youtube.json')
const ATTEMPTS = 12
const RETRY_DELAY_MS = 4000

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }

function decode(value) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code) => {
    if (code[0] === '#') {
      const point =
        code[1].toLowerCase() === 'x'
          ? parseInt(code.slice(2), 16)
          : parseInt(code.slice(1), 10)
      return String.fromCodePoint(point)
    }
    return ENTITIES[code.toLowerCase()] ?? match
  })
}

function tag(xml, name) {
  const match = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`))
  return match ? decode(match[1].trim()) : ''
}

function parseFeed(xml) {
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || []
  return entries.map((entry) => {
    const id = tag(entry, 'yt:videoId')
    const url =
      (entry.match(/<link rel="alternate" href="([^"]+)"/) || [])[1] ||
      `https://www.youtube.com/watch?v=${id}`
    return {
      id,
      // The feed links Shorts as /shorts/<id> and long-form as /watch?v=<id>.
      kind: url.includes('/shorts/') ? 'short' : 'episode',
      title: tag(entry, 'title'),
      url,
      published: tag(entry, 'published'),
      updated: tag(entry, 'updated'),
      description: tag(entry, 'media:description'),
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    }
  })
}

async function fetchFeed() {
  let lastStatus = 'no response'
  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(FEED_URL)
      if (response.ok) {
        const xml = await response.text()
        if (xml.includes('<feed')) return xml
        lastStatus = '200 without a feed body'
      } else {
        lastStatus = `HTTP ${response.status}`
      }
    } catch (error) {
      lastStatus = error.message
    }
    process.stdout.write(`attempt ${attempt}/${ATTEMPTS}: ${lastStatus}\n`)
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
  }
  throw new Error(
    `YouTube feed unavailable after ${ATTEMPTS} attempts (${lastStatus})`
  )
}

async function main() {
  const existing = fs.existsSync(OUTPUT)
    ? JSON.parse(fs.readFileSync(OUTPUT, 'utf8'))
    : { videos: [] }
  const fresh = parseFeed(await fetchFeed())
  if (fresh.length === 0) throw new Error('YouTube feed parsed to zero videos')

  const byId = new Map(existing.videos.map((video) => [video.id, video]))
  let added = 0
  for (const video of fresh) {
    if (!byId.has(video.id)) added += 1
    byId.set(video.id, video)
  }

  const videos = [...byId.values()].sort((a, b) =>
    b.published.localeCompare(a.published)
  )
  const output = {
    channelId: CHANNEL_ID,
    channelUrl: 'https://www.youtube.com/@Forgotten-Industries',
    videos,
  }
  fs.writeFileSync(OUTPUT, `${JSON.stringify(output, null, 2)}\n`)
  process.stdout.write(
    `youtube.json: ${videos.length} videos (${added} new, ${fresh.length} in feed)\n`
  )
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`)
  process.exit(1)
})
