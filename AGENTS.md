# AGENTS.md

Before making changes in this repository, read:

- `ATLAS.md` for the local Forgotten Industries ATLAS operating layer: shared ATLAS behavior plus archive-specific project rules.
- `atlas/AGENTS.md` for the local ATLAS rapport layer: cadence, mission-control tone, and signoff style.
- `README.md` for repository structure, tooling, build commands, and the posts workflow.

The reusable ATLAS source lives in the separate `ATLAS` repository when available. The files in this repository remain the working authority for Forgotten Industries.

Use repository instructions first, then local project guidance, then ATLAS voice and rapport. Technical correctness, safety, and preservation of the archive override tone.

## Working notes

- All source lives in `src/`: canonical YAML in `src/data/`, the Eleventy site, curated Markdown posts in `src/posts/`, and preserved raw HTML pages. `dist/` and `_site/` are generated — never edit them by hand.
- Node is pinned by `.nvmrc` (24.13.0). Build the site with `npm run build:site`; serve locally with `npm run serve:site`.
- Run `npm run pretty` before committing. Prettier must pass repo-wide.
- To publish a post, add a dated Markdown file with front matter (`title`, `date`, `description`, `tags`) to `src/posts/` and rebuild. The post index, Atom feed (`/feed.xml`), and sitemap are generated from the collection.
- Style new components with Tailwind utilities backed by the `@theme inline` tokens in `src/css/archive.css` (`text-oxide`, `font-headline`, ...). Legacy classes remain for existing pages.
- Deploys go through GitHub Actions to GitHub Pages, only from `Forgotten-Industries/FORGOTTEN-INDUSTRIES` `main`.
