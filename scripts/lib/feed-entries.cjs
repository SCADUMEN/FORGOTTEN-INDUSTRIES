// The unified Atom feed (/feed.xml) is built from the three things the site
// publishes on a date: L'Œuvre posts (the Eleventy `posts` collection), ATLAS
// reports (`archive.fieldLogs`), and YouTube videos (src/_data/youtube.json,
// written by scripts/sync_youtube.cjs). The sitemap's <lastmod> dates come from
// the first two. Shared by eleventy.config.js and tests/unit/feed.test.js.

const SITE_ORIGIN = 'https://forgotten-industries.net'

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function absoluteUrl(value) {
  return new URL(String(value || '/'), SITE_ORIGIN).href
}

// Feed readers resolve links against the reader, not the site, so the
// root-relative routes that linkifyRoutes writes are made absolute.
function absolutizeRootLinks(html) {
  return html.replace(/href="\/(?!\/)/g, `href="${SITE_ORIGIN}/`)
}

// ATLAS report dates are calendar days in Central time; the feed states them
// as midnight UTC, the same convention the plugin used for dated posts.
function logDate(log) {
  return new Date(`${log.date}T00:00:00Z`)
}

function fieldLogFeedHtml(log, linkifyRoutes) {
  const parts = []
  if (log.summary) parts.push(`<p><em>${escapeHtml(log.summary)}</em></p>`)
  for (const section of log.sections || []) {
    parts.push(`<h3>${escapeHtml(section.heading)}</h3>`)
    parts.push(`<p>${linkifyRoutes(section.body)}</p>`)
  }
  if (Array.isArray(log.sources) && log.sources.length > 0) {
    const items = log.sources
      .map(
        (source) =>
          `<li><a href="${escapeHtml(absoluteUrl(source.url))}">${escapeHtml(source.label)}</a></li>`
      )
      .join('')
    parts.push(`<h3>Sources</h3><ul>${items}</ul>`)
  }
  if (log.signature) parts.push(`<p><em>${escapeHtml(log.signature)}</em></p>`)
  return absolutizeRootLinks(parts.join('\n'))
}

function videoFeedHtml(video) {
  const thumbnail = `<p><a href="${escapeHtml(video.url)}"><img src="${escapeHtml(video.thumbnail)}" alt="${escapeHtml(video.title)}" width="480" height="360"></a></p>`
  const paragraphs = String(video.description || '')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
  return [thumbnail, ...paragraphs].join('\n')
}

function firstParagraph(text) {
  return (
    String(text || '')
      .split(/\n{2,}/)[0]
      .trim() || undefined
  )
}

// Newest first. Post entries keep the exact link and id the plugin-generated
// feed used (the absolute post URL), so existing subscribers see no reposts.
function buildFeedStream({ posts = [], fieldLogs = [], videos = [] }, options) {
  const { linkifyRoutes } = options
  const entries = [
    ...posts.map((post) => ({
      kind: 'oeuvre',
      label: "L'Œuvre",
      title: post.data.title,
      url: absoluteUrl(post.url),
      date: post.date,
      summary: post.data.summary,
      post,
    })),
    ...fieldLogs.map((log) => ({
      kind: 'atlas',
      label: 'ATLAS Report',
      title: log.title,
      url: absoluteUrl(`/atlas/${log.slug}/`),
      date: logDate(log),
      summary: log.summary,
      html: fieldLogFeedHtml(log, linkifyRoutes),
    })),
    ...videos.map((video) => ({
      kind: 'video',
      label: video.kind === 'short' ? 'YouTube Short' : 'YouTube Episode',
      title: video.title,
      url: video.url,
      date: new Date(video.published),
      summary: firstParagraph(video.description),
      html: videoFeedHtml(video),
    })),
  ]
  return entries.sort(
    (a, b) => b.date - a.date || String(a.title).localeCompare(String(b.title))
  )
}

function isoDay(date) {
  return new Date(date).toISOString().slice(0, 10)
}

function newest(dates) {
  return dates.length
    ? isoDay(Math.max(...dates.map((d) => +new Date(d))))
    : null
}

// Real publication dates only. A page with no dated source gets no <lastmod>
// rather than a build date that would claim every page changed on every deploy.
// Keys are canonical paths, matching the sitemap's own path normalization.
// Videos live on YouTube, so no page here changes when one is posted; they
// date nothing in the sitemap.
function sitemapLastmods({ posts = [], fieldLogs = [] }, canonicalPath) {
  const lastmods = new Map()
  const postDates = posts.map((post) => post.date)
  const logDates = fieldLogs.map(logDate)

  posts.forEach((post) =>
    lastmods.set(canonicalPath(post.url), isoDay(post.date))
  )
  fieldLogs.forEach((log) =>
    lastmods.set(canonicalPath(`/atlas/${log.slug}/`), isoDay(logDate(log)))
  )

  const indexes = {
    '/atlas/': newest(logDates),
    '/posts/': newest(postDates),
    '/blog/': newest(postDates),
    '/oeuvre/': newest(postDates),
    '/': newest([...postDates, ...logDates]),
  }
  for (const [pathname, day] of Object.entries(indexes)) {
    if (day) lastmods.set(pathname, day)
  }
  return lastmods
}

module.exports = {
  SITE_ORIGIN,
  buildFeedStream,
  escapeHtml,
  fieldLogFeedHtml,
  sitemapLastmods,
  videoFeedHtml,
}
