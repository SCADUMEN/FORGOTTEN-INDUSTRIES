import { feedPlugin } from '@11ty/eleventy-plugin-rss'

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(feedPlugin, {
    type: 'atom',
    outputPath: '/feed.xml',
    collection: { name: 'posts', limit: 0 },
    metadata: {
      title: 'Forgotten Industries',
      subtitle:
        'An archive and evidence-based memoir that explores what happens to the things we leave behind.',
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

  // Raw hand-authored archive pages are static documents, not templates.
  // html is excluded from templateFormats, so these are copied verbatim.
  eleventyConfig.addPassthroughCopy({
    'src/archive.html': 'archive.html',
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
