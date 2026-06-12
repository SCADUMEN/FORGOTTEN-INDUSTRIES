const ACTOR = 'forgotten-industry.bsky.social'
const API_URL = new URL(
  'https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed'
)
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

module.exports = async function () {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const response = await fetch(API_URL, { signal: controller.signal })

    if (!response.ok) {
      console.warn(
        `Field Notes fetch failed: ${response.status} ${response.statusText}`
      )
      return []
    }

    const data = await response.json()
    return (data.feed || [])
      .map(normalizePost)
      .filter(Boolean)
      .sort((a, b) => b.createdAt - a.createdAt)
  } catch (error) {
    console.warn(`Field Notes fetch failed: ${error.message}`)
    return []
  } finally {
    clearTimeout(timeout)
  }
}
