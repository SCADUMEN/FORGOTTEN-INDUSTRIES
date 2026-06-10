export default {
  layout: 'post.njk',
  tags: ['posts'],
  eleventyComputed: {
    // Preserve the full dated filename in the URL (page.filePathStem strips
    // the date prefix): /posts/2026-06-06-some-post.html
    permalink: (data) => {
      if (!data.page.inputPath.endsWith('.md')) return data.permalink
      const filename = data.page.inputPath.split('/').pop()
      return `/posts/${filename.replace(/\.md$/, '')}.html`
    },
  },
}
