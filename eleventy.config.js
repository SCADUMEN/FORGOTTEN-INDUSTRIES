export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy('assets')
  eleventyConfig.addPassthroughCopy('dist')
  eleventyConfig.addPassthroughCopy('docs')
  eleventyConfig.addPassthroughCopy('posts')
  eleventyConfig.addPassthroughCopy('projects')
  eleventyConfig.addPassthroughCopy('src/CNAME')

  // Publish the canonical archive sources for inspection, preserving the
  // /src/... URLs linked from archive.html.
  eleventyConfig.addPassthroughCopy({
    'src/data': 'src/data',
    'src/types.ts': 'src/types.ts',
  })

  eleventyConfig.addPassthroughCopy({
    'archive.html': 'archive.html',
    'field-log-template.html': 'field-log-template.html',
    'inventory.html': 'inventory.html',
    'social-posts.html': 'social-posts.html',
    'site-snapshots': 'site-snapshots',
  })

  eleventyConfig.addFilter('count', function (value) {
    return Array.isArray(value) ? value.length : 0
  })

  return {
    dir: {
      input: 'src',
      output: '_site',
      includes: '_includes',
      data: '_data',
    },
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
    templateFormats: ['njk', 'md', 'html'],
  }
}
