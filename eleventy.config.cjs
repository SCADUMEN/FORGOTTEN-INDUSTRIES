module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("dist");
  eleventyConfig.addPassthroughCopy("docs");
  eleventyConfig.addPassthroughCopy("posts");
  eleventyConfig.addPassthroughCopy("projects");
  eleventyConfig.addPassthroughCopy("src");
  eleventyConfig.addPassthroughCopy("site/CNAME");
  eleventyConfig.addPassthroughCopy("site/css");

  eleventyConfig.addPassthroughCopy({
    "about.html": "about.html",
    "archive.html": "archive.html",
    "contact.html": "contact.html",
    "field-log-template.html": "field-log-template.html",
    "inventory.html": "inventory.html",
    "social-posts.html": "social-posts.html",
    "site-snapshots": "site-snapshots"
  });

  eleventyConfig.addFilter("count", function(value) {
    return Array.isArray(value) ? value.length : 0;
  });

  return {
    dir: {
      input: "site",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html"]
  };
};
