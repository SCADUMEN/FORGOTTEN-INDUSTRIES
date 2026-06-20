export default {
  layout: 'archive-object.njk',
  eleventyComputed: {
    permalink: (data) => {
      if (!data.page.inputPath.endsWith('.md')) return data.permalink
      return `/archive/objects/${data.page.fileSlug}/index.html`
    },
    canonical: (data) =>
      `${data.site.domainUrl}/archive/objects/${data.page.fileSlug}/`,
    description: (data) =>
      `${data.object}. ${data.status}. Prototype L'Archive object record.`,
  },
}
