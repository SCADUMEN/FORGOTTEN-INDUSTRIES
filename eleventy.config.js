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
  return (
    pathname.startsWith('/posts/') &&
    pathname.endsWith('.html') &&
    pathname !== '/posts/index.html'
  )
}

function isFieldLogUrl(value = '') {
  const pathname = canonicalPath(value)
  return (
    pathname.startsWith('/field-logs/') &&
    pathname !== '/field-logs/' &&
    pathname !== '/field-logs/voice/' &&
    pathname.endsWith('/')
  )
}

function isCollectionUrl(value = '') {
  const pathname = canonicalPath(value)
  return (
    pathname === '/archive.html' ||
    pathname.startsWith('/archive/') ||
    pathname === '/posts/' ||
    pathname === '/projects/' ||
    pathname === '/field-notes/' ||
    pathname === '/field-logs/' ||
    pathname === '/field-logs/voice/'
  )
}

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(feedPlugin, {
    type: 'atom',
    outputPath: '/feed.xml',
    collection: { name: 'posts', limit: 0 },
    metadata: {
      title: 'Recoveries, Restorations, & Le Rèdempteur',
      subtitle:
        'Curated essays, field doctrine, and long-form entries from Forgotten Industries.',
      language: 'en',
      base: 'https://forgotten-industries.net/',
      author: { name: 'Matthew Marx' },
    },
  })

  // Published verbatim at their root URLs (Eleventy strips the input dir).
  // The markdown and yaml inside are documents, not templates — ignored.
  eleventyConfig.addPassthroughCopy('src/assets')
  eleventyConfig.addPassthroughCopy('src/docs')
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

  // Curated markdown posts render through the post layout; their raw
  // markdown stays published alongside at the same /posts/*.md URLs.
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
  eleventyConfig.addPassthroughCopy({
    'src/field-log-template.html': 'field-log-template.html',
    'src/inventory.html': 'inventory.html',
    'src/social-posts.html': 'social-posts.html',
  })

  // Authoring templates are source material, not site content.
  eleventyConfig.ignores.add('src/templates/**')

  eleventyConfig.addFilter('count', function (value) {
    return Array.isArray(value) ? value.length : 0
  })

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

  eleventyConfig.addFilter('archiveProjectUrl', function (project) {
    return `/archive/projects/${archiveSlug(project?.slug || project?.id || project?.title)}/`
  })

  eleventyConfig.addFilter(
    'archiveProjectIdUrl',
    function (projectId, projects) {
      const project = Array.isArray(projects)
        ? projects.find((entry) => entry?.id === projectId)
        : null
      return project
        ? `/archive/projects/${archiveSlug(project.slug || project.id || project.title)}/`
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
    return isArticleUrl(url) || isFieldLogUrl(url) ? 'article' : 'website'
  })

  eleventyConfig.addFilter(
    'schemaTypeForUrl',
    function (url, explicit, title, siteName) {
      if (explicit) return explicit
      if (title === siteName || canonicalPath(url) === '/') return 'WebSite'
      if (isArticleUrl(url)) return 'Article'
      if (isFieldLogUrl(url)) return 'CreativeWork'
      if (isCollectionUrl(url)) return 'CollectionPage'
      return 'WebPage'
    }
  )

  eleventyConfig.addFilter(
    'publicSitemapUrls',
    function (collection, extras, base, archive) {
      const urls = new Set()

      function add(value) {
        if (!value) return
        const pathname = canonicalPath(value)
        if (pathname === '/sitemap.xml' || pathname === '/robots.txt') return
        if (pathname.endsWith('.xml') || pathname.endsWith('.txt')) return
        if (!(pathname.endsWith('/') || pathname.endsWith('.html'))) return
        urls.add(canonicalUrl(pathname, base))
      }

      if (Array.isArray(collection)) {
        collection.forEach((entry) => add(entry.url))
      }
      if (Array.isArray(extras)) {
        extras.forEach(add)
      }
      if (Array.isArray(archive?.fieldLogs)) {
        archive.fieldLogs.forEach((log) => add(`/field-logs/${log.slug}/`))
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

      return [...urls].sort((a, b) => a.localeCompare(b))
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
