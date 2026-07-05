const fs = require('fs')
const path = require('path')

const ACTOR = 'forgotten-industry.bsky.social'
const API_URL = new URL(
  'https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed'
)

// Resolved per call so tests can redirect the cache to a temp file via
// FIELDNOTES_CACHE_FILE instead of clobbering the real .cache entry.
function cacheFile() {
  return (
    process.env.FIELDNOTES_CACHE_FILE ||
    path.join(__dirname, '..', '..', '.cache', 'fieldnotes.json')
  )
}
API_URL.searchParams.set('actor', ACTOR)
API_URL.searchParams.set('filter', 'posts_no_replies')
API_URL.searchParams.set('limit', '50')

function blueskyPostUrl(uri, handle = ACTOR) {
  const parts = uri.split('/')
  const rkey = parts[parts.length - 1]
  return `https://bsky.app/profile/${handle}/post/${rkey}`
}

function normalizePost(item) {
  const post = item.post
  const record = post.record || {}
  const author = post.author || {}

  if (!post.uri || !record.text || author.handle !== ACTOR) {
    return null
  }

  return {
    id: post.uri,
    text: record.text,
    createdAt: new Date(record.createdAt || post.indexedAt),
    url: blueskyPostUrl(post.uri, author.handle),
    likeCount: post.likeCount || 0,
    repostCount: post.repostCount || 0,
    replyCount: post.replyCount || 0,
  }
}

function writeCache(posts) {
  const file = cacheFile()
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, `${JSON.stringify(posts, null, 2)}\n`)
  } catch (error) {
    console.warn(`Live Dispatches cache write failed: ${error.message}`)
  }
}

// Fall back to the last successful fetch so a transient network failure does
// not silently blank the Live Dispatches shelf. createdAt is a Date on the
// live path but serializes to a string in JSON, so rehydrate it to match.
function readCacheOrEmpty() {
  try {
    const posts = JSON.parse(fs.readFileSync(cacheFile(), 'utf8'))
    console.warn(`Live Dispatches: serving ${posts.length} cached post(s).`)
    return posts.map((post) => ({
      ...post,
      createdAt: new Date(post.createdAt),
    }))
  } catch {
    return []
  }
}

module.exports = async function () {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const response = await fetch(API_URL, { signal: controller.signal })

    if (!response.ok) {
      console.warn(
        `Live Dispatches fetch failed: ${response.status} ${response.statusText}`
      )
      return readCacheOrEmpty()
    }

    const data = await response.json()
    const posts = (data.feed || [])
      .map(normalizePost)
      .filter(Boolean)
      .sort((a, b) => b.createdAt - a.createdAt)
    writeCache(posts)
    return posts
  } catch (error) {
    console.warn(`Live Dispatches fetch failed: ${error.message}`)
    return readCacheOrEmpty()
  } finally {
    clearTimeout(timeout)
  }
}

// Exposed for unit tests. Eleventy invokes the default function export above
// and ignores these extra properties, so attaching them is behavior-neutral.
module.exports.blueskyPostUrl = blueskyPostUrl
module.exports.normalizePost = normalizePost
