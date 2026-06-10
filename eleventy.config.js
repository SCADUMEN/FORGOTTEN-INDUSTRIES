export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy('assets')
  eleventyConfig.addPassthroughCopy('dist')
  eleventyConfig.addPassthroughCopy('docs')
  eleventyConfig.addPassthroughCopy('projects')
  eleventyConfig.addPassthroughCopy('src/CNAME')

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

  // Raw hand-authored archive pages are static documents, not templates.
  // html is excluded from templateFormats, so these are copied verbatim.
  eleventyConfig.addPassthroughCopy({
    'src/archive.html': 'archive.html',
    'src/field-log-template.html': 'field-log-template.html',
    'src/inventory.html': 'inventory.html',
    'src/social-posts.html': 'social-posts.html',
    'site-snapshots': 'site-snapshots',
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
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'long',
      timeZone: 'UTC',
    }).format(value)
  })

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
