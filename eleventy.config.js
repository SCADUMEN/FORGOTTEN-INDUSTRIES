import fs from 'node:fs'
import nodePath from 'node:path'
import { feedPlugin } from '@11ty/eleventy-plugin-rss'

function canonicalPath(value = '/') {
  const raw = String(value || '/').trim()
  const url =
    raw.startsWith('http://') || raw.startsWith('https://')
      ? new URL(raw)
      : new URL(raw, 'https://forgotten-industries.net')

  let pathname = url.pathname || '/'
  if (pathname.endsWith('/index.html')) {
    pathname = pathname.slice(0, -'index.html'.length)
  }
  if (!pathname.startsWith('/')) pathname = `/${pathname}`

  return `${pathname}${url.search || ''}`
}

function canonicalUrl(value = '/', base = 'https://forgotten-industries.net') {
  const origin = new URL(base).origin
  return `${origin}${canonicalPath(value)}`
}

function archiveSlug(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function isArticleUrl(value = '') {
  const pathname = canonicalPath(value)
  // "posts" is retained as the Eleventy collection and URL implementation for
  // Les Manuscrits so existing manuscript links and feed behavior stay stable.
  return (
    pathname.startsWith('/posts/') &&
    pathname.endsWith('.html') &&
    pathname !== '/posts/index.html'
  )
}

// ATLAS report detail pages live under /atlas/, matching their index. They
// previously sat under /field-logs/, which is the recorded voice Field Log
// index — a different dataset entirely.
function isAtlasReportUrl(value = '') {
  const pathname = canonicalPath(value)
  return (
    pathname.startsWith('/atlas/') &&
    pathname !== '/atlas/' &&
    pathname.endsWith('/')
  )
}

function isCollectionUrl(value = '') {
  const pathname = canonicalPath(value)
  return (
    pathname === '/l-archive/' ||
    // Legacy archive doors remain collection pages for compatibility metadata;
    // canonical URLs and new public links should prefer /l-archive/.
    pathname === '/archive/' ||
    pathname === '/archive.html' ||
    pathname.startsWith('/archive/') ||
    pathname === '/oeuvre/' ||
    pathname === '/signal/' ||
    pathname === '/apropos/' ||
    pathname === '/provenance/' ||
    pathname === '/atlas/' ||
    pathname === '/doctrine/' ||
    pathname === '/posts/' ||
    pathname === '/projects/' ||
    pathname === '/field-notes/' ||
    pathname === '/field-logs/' ||
    pathname === '/field-logs/voice/'
  )
}

// Shared URL gathering for both sitemap outputs (XML + human-readable page).
// Returns deduped, sorted pathnames using identical inclusion/exclusion rules.
function gatherSitemapPaths(collection, extras, archive) {
  const paths = new Set()

  function add(value) {
    if (!value) return
    const pathname = canonicalPath(value)
    if (pathname === '/sitemap.xml' || pathname === '/robots.txt') return
    if (pathname.endsWith('.xml') || pathname.endsWith('.txt')) return
    if (!(pathname.endsWith('/') || pathname.endsWith('.html'))) return
    paths.add(pathname)
  }

  if (Array.isArray(collection)) {
    collection.forEach((entry) => add(entry.url))
  }
  if (Array.isArray(extras)) {
    extras.forEach(add)
  }
  if (Array.isArray(archive?.fieldLogs)) {
    archive.fieldLogs.forEach((log) => add(`/atlas/${log.slug}/`))
  }
  if (Array.isArray(archive?.inventory)) {
    archive.inventory.forEach((item) =>
      add(`/archive/objects/${archiveSlug(item.id || item.name)}/`)
    )
  }
  if (Array.isArray(archive?.projects)) {
    archive.projects.forEach((project) =>
      add(
        `/archive/projects/${archiveSlug(project.slug || project.id || project.title)}/`
      )
    )
  }

  return [...paths].sort((a, b) => a.localeCompare(b))
}

// Build a single directory-style tree rooted at "/". Every URL path segment
// becomes a node; a node is a "page" (linkable) when a pathname terminates on
// it, otherwise it is a pure structural directory. All pages descend logically
// from "/", mirroring the site's URL hierarchy.
function buildSitemapTree(pathnames) {
  const root = { segment: '/', url: null, isHtml: false, children: new Map() }

  for (const pathname of pathnames) {
    // The site root has no segments; it is the tree root itself.
    if (pathname === '/') {
      root.url = '/'
      continue
    }

    const isHtml = pathname.endsWith('.html')
    const segments = pathname.replace(/\/+$/, '').split('/').filter(Boolean)
    let node = root
    segments.forEach((segment, index) => {
      if (!node.children.has(segment)) {
        node.children.set(segment, {
          segment,
          url: null,
          isHtml: false,
          children: new Map(),
        })
      }
      node = node.children.get(segment)
      if (index === segments.length - 1) {
        node.url = pathname
        node.isHtml = isHtml
      }
    })
  }

  function finalize(node) {
    const children = [...node.children.values()]
      .map(finalize)
      .sort((a, b) => a.name.localeCompare(b.name))
    // A trailing slash marks a directory (a node with descendants); leaf pages
    // read as files without one. The link href keeps the real URL either way.
    let name
    if (node.segment === '/') name = '/'
    else if (node.isHtml) name = node.segment
    else name = node.segment + (children.length ? '/' : '')
    return { name, url: node.url || null, children }
  }

  return finalize(root)
}

function collectSitemapPaths(collection, extras, archive, taxonomy) {
  const seen = new Set()
  const paths = []
  const add = (pathname) => {
    if (!pathname || seen.has(pathname)) return
    seen.add(pathname)
    paths.push(pathname)
  }

  for (const pathname of gatherSitemapPaths(collection, extras, archive)) {
    add(pathname)
  }

  // Fold taxonomy term pages into the tree by their URL path, mirroring the
  // XML sitemap's categories/tags/status/systems coverage.
  const taxonomyTerms = [
    ...(taxonomy?.categories || []),
    ...(taxonomy?.tags || []),
    ...(taxonomy?.status || []),
    ...(taxonomy?.systems || []),
  ]
  for (const term of taxonomyTerms) {
    if (term?.url) add(canonicalPath(term.url))
  }

  return paths
}

function countValue(value) {
  if (Array.isArray(value)) return value.length

  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function pluralLabelForCount(count, singular, plural) {
  return count === 1 ? singular : plural || `${singular}s`
}

function recordDateValue(record) {
  return String(
    record?.date ||
      record?.date_logged ||
      record?.revived ||
      record?.started ||
      ''
  )
}

// Controlled shelf vocabulary. A post declares exactly one, and it decides the
// shelf outright. The heuristics below remain only as a fallback for records
// that predate the field: they inspect freeform `type`, `category`, and
// `shelf_label` strings, which produced a partition that both overlapped (a
// Le Blog dispatch and the Prelude were listed on Les Manuscrits *and* Le
// Blog) and could not be predicted when writing a new post.
const POST_SHELVES = new Set(['doctrine', 'signal', 'manuscrit'])

function declaredShelf(record) {
  const data = record?.data || record || {}
  const value = String(data.shelf || '')
    .toLowerCase()
    .trim()

  return POST_SHELVES.has(value) ? value : null
}

function isDoctrinePost(record) {
  const data = record?.data || record || {}
  const tags = Array.isArray(data.tags) ? data.tags.join(' ') : ''
  const classification = [data.type, data.category, tags]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return classification.includes('doctrine')
}

function isLeSignalPost(record) {
  const data = record?.data || record || {}
  const tags = Array.isArray(data.tags) ? data.tags.join(' ') : ''
  const classification = [data.type, data.category, data.shelf_label, tags]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return /\ble[-\s]signal\b/.test(classification)
}

function isLeBlogPost(record) {
  const data = record?.data || record || {}
  const tags = Array.isArray(data.tags) ? data.tags.join(' ') : ''
  const classification = [data.type, data.category, data.shelf_label, tags]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return /\ble[-\s]blog\b/.test(classification)
}

function isPreludePost(record) {
  const data = record?.data || record || {}
  const tags = Array.isArray(data.tags) ? data.tags.join(' ') : ''
  const classification = [data.type, data.category, data.shelf_label, tags]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return /\bprelude\b/.test(classification)
}

// The three shelves partition the post collection: every post lands on exactly
// one. Signal absorbs blog and prelude records; manuscripts are the remainder.
function postShelf(record) {
  const declared = declaredShelf(record)
  if (declared) return declared
  if (isDoctrinePost(record)) return 'doctrine'
  if (isLeSignalPost(record) || isLeBlogPost(record) || isPreludePost(record)) {
    return 'signal'
  }
  return 'manuscrit'
}

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(feedPlugin, {
    type: 'atom',
    outputPath: '/feed.xml',
    // The internal collection remains "posts"; the public feed covers the
    // assembled written work layer for URL and reader compatibility.
    collection: { name: 'posts', limit: 0 },
    metadata: {
      title: "Forgotten Industries / L'Œuvre",
      subtitle:
        'Assembled manuscripts and doctrine records from Forgotten Industries.',
      language: 'en',
      base: 'https://forgotten-industries.net/',
      author: { name: 'Matthew Marx' },
    },
  })

  // Published verbatim at their root URLs (Eleventy strips the input dir).
  // The markdown and yaml inside are documents, not templates — ignored.
  eleventyConfig.addPassthroughCopy('src/assets')
  eleventyConfig.addPassthroughCopy({ 'src/.well-known': '.well-known' })
  // Standalone pages that deliberately skip archive.css still need the
  // self-hosted @font-face rules, so the generated sheet ships on its own too.
  eleventyConfig.addPassthroughCopy({ 'src/css/fonts.css': 'css/fonts.css' })
  eleventyConfig.addPassthroughCopy('src/_headers')
  eleventyConfig.addPassthroughCopy('src/_redirects')
  eleventyConfig.addPassthroughCopy('src/docs')
  // src/projects is a legacy source-dossier directory. Keep it published for
  // source inspection while public labels say Les Dossiers.
  eleventyConfig.addPassthroughCopy('src/projects')
  eleventyConfig.addPassthroughCopy('src/site-snapshots')
  eleventyConfig.addPassthroughCopy(
    'src/forgotten-industries/l-archive/caselabs-s8/assets'
  )
  eleventyConfig.ignores.add('src/assets/**')
  eleventyConfig.ignores.add('src/docs/**')
  eleventyConfig.ignores.add('src/projects/**')
  eleventyConfig.ignores.add('src/site-snapshots/**')

  eleventyConfig.addPassthroughCopy('dist')

  // CxR (CONTINUANCExRESEARCH) is a Vite/React app built to continuance/dist by
  // `npm run build:continuance` (which runs before eleventy in build:site). The
  // page shell is rendered by Eleventy (src/cxr.njk, using base.njk) so CxR
  // carries the global header/footer like any other page; here we copy only the
  // built bundle and data next to it. It serves at /cxr/.
  eleventyConfig.addPassthroughCopy({ 'continuance/dist/assets': 'cxr/assets' })
  eleventyConfig.addPassthroughCopy({ 'continuance/dist/data': 'cxr/data' })

  // The canonical CONTINUANCE persona source, published for inspection like the
  // ATLAS source dossier. Repo root is outside src/, so it needs its own copy.
  eleventyConfig.addPassthroughCopy({ 'continuance.md': 'continuance.md' })

  // Les Manuscrits render through the post layout; their raw markdown stays
  // published alongside at the same /posts/*.md URLs for compatibility.
  // Imported social records are static evidence, copied verbatim.
  eleventyConfig.addPassthroughCopy('src/posts/*.md')
  eleventyConfig.addPassthroughCopy({ 'src/posts/social': 'posts/social' })
  eleventyConfig.ignores.add('src/posts/social/**')
  eleventyConfig.ignores.add('src/posts/README.md')

  // Publish the canonical archive sources for inspection, preserving the
  // /src/... URLs linked from archive.html.
  eleventyConfig.addPassthroughCopy({
    'src/data': 'src/data',
    'src/types.ts': 'src/types.ts',
  })

  // Raw hand-authored support pages are static documents, not templates.
  // html is excluded from templateFormats, so these are copied verbatim.
  // (/inventory.html is served by inventory-html-redirect.njk instead.)
  eleventyConfig.addPassthroughCopy({
    'src/field-log-template.html': 'field-log-template.html',
    'src/social-posts.html': 'social-posts.html',
  })

  // Authoring templates are source material, not site content.
  eleventyConfig.ignores.add('src/templates/**')

  eleventyConfig.addFilter('count', function (value) {
    return countValue(value)
  })

  // Escape a plain-text body, then linkify internal absolute-path routes
  // (e.g. /maple-leaf-rag-zone/). Bounded by start/space/paren so file paths
  // such as src/docs/ are left untouched. Output is pre-escaped; use with `safe`.
  eleventyConfig.addFilter('linkifyRoutes', function (value) {
    if (value == null) return value
    const escaped = String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
    return escaped.replace(
      /(^|[\s(])(\/[a-z0-9]+(?:-[a-z0-9]+)*\/)/g,
      (match, pre, route) => `${pre}<a href="${route}">${route}</a>`
    )
  })

  eleventyConfig.addFilter('pluralLabel', function (value, singular, plural) {
    return pluralLabelForCount(countValue(value), singular, plural)
  })

  eleventyConfig.addFilter('countLabel', function (value, singular, plural) {
    const count = countValue(value)
    return `${count} ${pluralLabelForCount(count, singular, plural)}`
  })

  eleventyConfig.addFilter('latestRecords', function (records, limit = 3) {
    return Array.isArray(records)
      ? [...records]
          .sort((a, b) => {
            const dateSort = recordDateValue(b).localeCompare(
              recordDateValue(a)
            )
            if (dateSort !== 0) return dateSort
            return String(b?.id || '').localeCompare(String(a?.id || ''))
          })
          .slice(0, Number(limit) || 3)
      : []
  })

  eleventyConfig.addFilter('doctrinePosts', function (records) {
    return Array.isArray(records)
      ? records.filter((record) => postShelf(record) === 'doctrine')
      : []
  })

  eleventyConfig.addFilter('manuscriptPosts', function (records) {
    return Array.isArray(records)
      ? records.filter((record) => postShelf(record) === 'manuscrit')
      : []
  })

  eleventyConfig.addFilter('signalPosts', function (records) {
    return Array.isArray(records)
      ? records.filter((record) => postShelf(record) === 'signal')
      : []
  })

  eleventyConfig.addFilter('postShelf', postShelf)

  eleventyConfig.addFilter('isoDate', function (value) {
    return value.toISOString().split('T')[0]
  })

  eleventyConfig.addFilter('readableDate', function (value) {
    return value.toISOString().split('T')[0].replaceAll('-', '.')
  })

  eleventyConfig.addFilter('archiveSlug', archiveSlug)

  eleventyConfig.addFilter('archiveObjectUrl', function (item) {
    return `/archive/objects/${archiveSlug(item?.id || item?.name)}/`
  })

  // `photos` is a mixed media list: source stills, QuickTime clips from a
  // phone, and private HEIC originals that never clear the public path check.
  // Renderers need the stills and the footage kept apart, because an extension
  // the browser cannot decode in an <img> is a broken record, not a photograph.
  // Anything unrecognised (.heic today) is withheld rather than published broken.
  const OBJECT_IMAGE_EXTENSIONS = /\.(avif|gif|jpe?g|png|svg|webp)$/i
  const OBJECT_VIDEO_EXTENSIONS = /\.(mov|mp4|webm)$/i

  function publicObjectMedia(item) {
    return Array.isArray(item?.photos)
      ? item.photos.filter(
          (photo) =>
            typeof photo === 'string' &&
            (photo.startsWith('assets/') ||
              photo.startsWith('forgotten-industries/'))
        )
      : []
  }

  function publicObjectPhotos(item) {
    return publicObjectMedia(item).filter((photo) =>
      OBJECT_IMAGE_EXTENSIONS.test(photo)
    )
  }

  function publicObjectVideos(item) {
    return publicObjectMedia(item).filter((photo) =>
      OBJECT_VIDEO_EXTENSIONS.test(photo)
    )
  }

  const MEDIA_MIME_TYPES = {
    mov: 'video/quicktime',
    mp4: 'video/mp4',
    webm: 'video/webm',
  }

  eleventyConfig.addFilter('publicObjectPhotos', publicObjectPhotos)
  eleventyConfig.addFilter('publicObjectVideos', publicObjectVideos)

  eleventyConfig.addFilter('mediaMimeType', function (value) {
    const extension = String(value || '')
      .split('.')
      .pop()
      .toLowerCase()
    return MEDIA_MIME_TYPES[extension] || ''
  })

  // Inventory `photos` entries name the preserved source, which for phone
  // footage is a QuickTime .mov only Safari will play. Where
  // scripts/build_media_derivatives.cjs has written web-playable siblings, they
  // are offered first and the original stays as the final <source>, so the
  // record still points at the file the archive actually holds.
  const VIDEO_DERIVATIVE_ORDER = ['webm', 'mp4']

  eleventyConfig.addFilter('videoSources', function (value) {
    const original = String(value || '')
    if (!original) return []

    const base = original.replace(/\.[^.]+$/, '')
    const originalExtension = original.split('.').pop().toLowerCase()
    const sources = []

    for (const extension of VIDEO_DERIVATIVE_ORDER) {
      if (extension === originalExtension) continue
      const candidate = `${base}.${extension}`
      if (fs.existsSync(nodePath.join('src', candidate))) {
        sources.push({
          src: `/${candidate}`,
          type: MEDIA_MIME_TYPES[extension],
        })
      }
    }

    sources.push({
      src: `/${original}`,
      type: MEDIA_MIME_TYPES[originalExtension] || '',
    })
    return sources
  })

  eleventyConfig.addFilter('objectPrimaryImage', function (item) {
    const photo = publicObjectPhotos(item)[0]
    return photo ? `/${photo}` : ''
  })

  eleventyConfig.addFilter('countObjectsWithPhotos', function (items) {
    return Array.isArray(items)
      ? items.filter((item) => publicObjectPhotos(item).length > 0).length
      : 0
  })

  function objectGalleryCandidates(items) {
    return Array.isArray(items)
      ? items.filter(
          (item) =>
            item?.category !== 'photo evidence set' &&
            publicObjectPhotos(item).length > 0
        )
      : []
  }

  function gallerySortKey(item) {
    const input = String(item?.id || item?.name || '')
    let hash = 0
    for (let index = 0; index < input.length; index += 1) {
      hash = (hash << 5) - hash + input.charCodeAt(index)
      hash |= 0
    }
    return Math.abs(hash)
  }

  eleventyConfig.addFilter('objectGalleryCandidates', objectGalleryCandidates)

  eleventyConfig.addFilter(
    'objectGalleryPreview',
    function (items, limit = 12) {
      return objectGalleryCandidates(items)
        .sort((a, b) => gallerySortKey(a) - gallerySortKey(b))
        .slice(0, Number(limit) || 12)
    }
  )

  eleventyConfig.addFilter('relatedObjects', function (items, item) {
    if (!Array.isArray(items) || !item) return []

    return items
      .filter(
        (candidate) =>
          candidate?.id !== item.id &&
          candidate?.associated_project === item.associated_project
      )
      .sort((a, b) => {
        const aCategoryMatch = a?.category === item.category ? 1 : 0
        const bCategoryMatch = b?.category === item.category ? 1 : 0
        return (
          bCategoryMatch - aCategoryMatch ||
          String(a?.id || '').localeCompare(String(b?.id || ''))
        )
      })
      .slice(0, 6)
  })

  eleventyConfig.addFilter('fieldLogsForProject', function (logs, projectId) {
    return Array.isArray(logs)
      ? logs.filter((log) => log?.associated_project === projectId)
      : []
  })

  eleventyConfig.addFilter('archiveProjectUrl', function (project) {
    // The URL remains /archive/projects/* for backwards compatibility. Public
    // page labels call these records Dossiers.
    return `/archive/projects/${archiveSlug(project?.slug || project?.id || project?.title)}/`
  })

  eleventyConfig.addFilter(
    'archiveProjectIdUrl',
    function (projectId, projects) {
      const project = Array.isArray(projects)
        ? projects.find((entry) => entry?.id === projectId)
        : null
      return project
        ? // The route remains /archive/projects/*; visible labels say Dossier.
          `/archive/projects/${archiveSlug(project.slug || project.id || project.title)}/`
        : '/archive/projects/'
    }
  )

  eleventyConfig.addFilter(
    'whereAssociatedProject',
    function (records, projectId) {
      return Array.isArray(records)
        ? records.filter((record) => record?.associated_project === projectId)
        : []
    }
  )

  eleventyConfig.addFilter('fieldLogsNewest', function (logs) {
    return Array.isArray(logs)
      ? [...logs].sort((a, b) => {
          const dateSort = String(b.date || '').localeCompare(
            String(a.date || '')
          )
          if (dateSort !== 0) return dateSort
          return String(b.id || '').localeCompare(String(a.id || ''))
        })
      : []
  })

  eleventyConfig.addFilter('fieldLogCategories', function (logs) {
    const categories = new Set()
    if (Array.isArray(logs)) {
      logs.forEach((log) => {
        if (log?.category) categories.add(log.category)
      })
    }
    return [...categories].sort((a, b) => a.localeCompare(b))
  })

  eleventyConfig.addFilter('byCategory', function (logs, category) {
    return Array.isArray(logs)
      ? logs.filter((log) => log?.category === category)
      : []
  })

  eleventyConfig.addFilter('findById', function (records, id) {
    return Array.isArray(records)
      ? records.find((record) => record?.id === id) || null
      : null
  })

  eleventyConfig.addFilter('latestCollectionItem', function (records) {
    return Array.isArray(records) && records.length
      ? [...records].sort((a, b) => new Date(b.date) - new Date(a.date))[0]
      : null
  })

  eleventyConfig.addFilter('latestRecord', function (records) {
    return Array.isArray(records) && records.length
      ? [...records].sort((a, b) => {
          const aDate = String(
            a.date || a.date_logged || a.revived || a.started || ''
          )
          const bDate = String(
            b.date || b.date_logged || b.revived || b.started || ''
          )
          return (
            bDate.localeCompare(aDate) ||
            String(b.id).localeCompare(String(a.id))
          )
        })[0]
      : null
  })

  eleventyConfig.addFilter('latestRestoration', function (records) {
    const restorations = Array.isArray(records)
      ? records.filter((record) =>
          `${record.title || ''} ${record.category || ''}`
            .toLowerCase()
            .includes('restor')
        )
      : []
    return restorations.length
      ? restorations.sort((a, b) =>
          String(b.revived || b.started || '').localeCompare(
            String(a.revived || a.started || '')
          )
        )[0]
      : records?.[0] || null
  })

  eleventyConfig.addFilter('canonicalUrl', canonicalUrl)

  eleventyConfig.addFilter('absoluteUrl', function (value, base) {
    if (!value) return ''
    return value.startsWith('http://') || value.startsWith('https://')
      ? value
      : canonicalUrl(value, base)
  })

  eleventyConfig.addFilter('json', function (value) {
    return JSON.stringify(value)
  })

  eleventyConfig.addFilter('ogTypeForUrl', function (url, explicit) {
    if (explicit) return explicit
    return isArticleUrl(url) || isAtlasReportUrl(url) ? 'article' : 'website'
  })

  eleventyConfig.addFilter(
    'schemaTypeForUrl',
    function (url, explicit, title, siteName) {
      if (explicit) return explicit
      if (title === siteName || canonicalPath(url) === '/') return 'WebSite'
      if (isArticleUrl(url)) return 'Article'
      if (isAtlasReportUrl(url)) return 'CreativeWork'
      if (isCollectionUrl(url)) return 'CollectionPage'
      return 'WebPage'
    }
  )

  eleventyConfig.addFilter(
    'publicSitemapUrls',
    function (collection, extras, base, archive) {
      return gatherSitemapPaths(collection, extras, archive).map((pathname) =>
        canonicalUrl(pathname, base)
      )
    }
  )

  eleventyConfig.addFilter(
    'sitemapTree',
    function (collection, extras, archive, taxonomy) {
      const paths = collectSitemapPaths(collection, extras, archive, taxonomy)
      return buildSitemapTree(paths)
    }
  )

  return {
    dir: {
      input: 'src',
      output: '_site',
      includes: '_includes',
      data: '_data',
    },
    markdownTemplateEngine: 'njk',
    templateFormats: ['njk', 'md'],
  }
}
