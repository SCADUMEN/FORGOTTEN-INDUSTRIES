# Forgotten Industries

Canonical archive data, raw HTML reference pages, and an Eleventy mirror for Forgotten Industries.

All source lives in `src/`: the canonical YAML archive in `src/data/`, the Eleventy site, the curated posts, and the preserved raw HTML pages. The build step converts the archive into package-ready outputs in `dist/` (generated, not tracked):

- `dist/forgotten-industries.json`
- `dist/index.ts`

This follows the same architectural pattern as Tyler Etters' discography repo: edit canonical YAML first, generate typed and machine-readable output second, let websites and packages consume the generated archive later.

He has found what I always failed to fully grasp: my voice.
My Brother's Keeper, indeed ~ Thank you, Tyler.

## Setup

No dependency install is required for the archive data build.

```bash
npm run build
```

The build uses Ruby's standard YAML parser, which is available on macOS by default. If `npm` is not installed yet, run the converter directly:

```bash
ruby scripts/build.rb
```

To build the Eleventy mirror:

```bash
npm install
npm run build:site
```

## Tooling

- Node is pinned to `24.13.0` via `.nvmrc` and `.node-version`; CI reads the same file.
- Prettier formats the repo (`prettier.config.js`, with the Tailwind class-sorting plugin). Run `npm run pretty` before committing. Generated and preserved artifacts (`dist/`, `_site/`, `src/site-snapshots/`) are excluded via `.prettierignore`.
- The Eleventy config is ESM (`eleventy.config.js`).
- GitHub Actions builds every push to `main`, but only the org repo (`Forgotten-Industries/FORGOTTEN-INDUSTRIES`) deploys to GitHub Pages — forks run the build as a CI check.
- Tailwind 4 styles the site. The archive design tokens are exposed via `@theme inline` in `src/css/archive.css`, so new components use utilities (`text-oxide`, `font-headline`); the legacy classes remain for existing pages.
- An Atom feed of the posts collection is published at `/feed.xml`, and a sitemap at `/sitemap.xml`.

## Curated Posts

Posts are Markdown files in `src/posts/` with front matter (`title`, `date`, `description`, `tags`). Eleventy renders each through the post layout at `/posts/<filename>.html`, publishes the raw Markdown alongside at `/posts/<filename>.md`, and generates the post index at `/posts/` from the collection. To publish a post, add a dated Markdown file to `src/posts/` and rebuild.

- `src/posts/2026-06-06-prelude-a-thing-documented-is-a-thing-not-yet-lost.md` - Entry 000 prelude.
- `src/posts/2026-06-10-perspective-peregrines-and-pang.md` - Entry 001 field doctrine.
- The hand-written HTML versions of these posts remain in `src/posts/` as preserved artifacts.

The visible top-level shelves are THE ARCHIVE, Recovery & Restorations, Field Lab Journal, Project Dossiers, Manuscripts, Technical References, and What About Art? The canonical category map lives in `src/docs/site-architecture-dossier.md`.

The old GitHub Pages trial surface is preserved at `src/site-snapshots/github-pages-trial-2026-06-06/`.

## Eleventy Mirror

The Eleventy input directory is `src/`:

- `src/index.njk` - generated public home page.
- `src/_includes/base.njk` - shared HTML shell.
- `src/_includes/post.njk` - post layout (Tailwind utilities).
- `src/_data/site.cjs` - domain, GitHub, contact, and identity data.
- `src/_data/archive.cjs` - reads `dist/forgotten-industries.json`.
- `src/css/archive.css` - Tailwind entry, design tokens, and archive styling.
- `src/CNAME` - portability marker for `forgotten-industries.net`.

The hand-authored raw HTML pages live in `src/` as durable, inspectable archive documents; the deployed ones (`archive.html`, `inventory.html`, `social-posts.html`, `field-log-template.html`) are copied verbatim. GitHub Pages deploys the Eleventy output from `_site/`.

## Update Workflow

1. Edit `src/data/projects.yml`, `src/data/inventory.yml`, or `src/data/field-logs.yml`.
2. If the data shape changes, update `src/types.ts`.
3. Run `npm run build`.
4. Inspect `dist/forgotten-industries.json` for downstream consumers.
5. Inspect `dist/index.ts` for TypeScript consumers.

## Reference Docs

- `src/docs/archive-photo-procedure.md` - field procedure for cataloging and photographing recovered parts before cleaning, sorting, or restoration.
- `src/docs/obs-archive-station-procedure.md` - fixed-camera OBS procedure for fast, repeatable archive intake screenshots.
- `src/docs/potato-dossier.md` - companion / lab partner context for Potato's role in the archive and operating environment.
- `src/docs/repository-architecture.md` - public-safe repo split and naming map for `FI (src)`, `FI (pub)`, and private staging boundaries.
- `src/docs/site-architecture-dossier.md` - canonical top-level site spine, navigation, and category tone rules.

## Import Social Posts

```bash
ruby scripts/import_social.rb
ruby scripts/build.rb
```

The importer reads public Tumblr and Instagram data for Forgotten Industries, saves local media into `src/assets/social/`, writes Markdown posts into `src/posts/social/`, writes canonical records to `src/data/social-posts.yml`, and regenerates `src/social-posts.html`.

Tumblr currently exposes 2 public posts through its feed. Instagram reports 59 public posts, but unauthenticated access may rate-limit or require login while paginating older posts. When that happens, the importer keeps the posts it can verify and can be rerun later.

For browser-assisted Instagram recovery, scrape the profile into a JSON payload and import it explicitly:

```bash
INSTAGRAM_RECOVERY_JSON=/path/to/forgotten-instagram-recovered.json ruby scripts/import_social.rb
ruby scripts/build.rb
```

That mode preserves existing Tumblr records from `src/data/social-posts.yml` and rebuilds the Instagram archive from the recovered JSON.

## Publishing Later

The archive is not published yet. When it is ready to become an npm package:

1. Choose a final package name and license.
2. Add tests for schema validation.
3. Add a `prepublishOnly` script that runs `npm run build`.
4. Run `npm publish --access public` if publishing a scoped public package.

## Files

- `src/data/projects.yml` - canonical restoration projects and category records.
- `src/data/inventory.yml` - canonical machines, parts, accessories, condition, and disposition.
- `src/data/field-logs.yml` - canonical field logs and method notes.
- `src/data/social-posts.yml` - imported Tumblr and Instagram posts with source URLs, dates, captions, local media, and generated Markdown paths.
- `src/types.ts` - TypeScript schema for the generated archive.
- `scripts/import_social.rb` - public Tumblr/Instagram importer for social posts and media.
- `scripts/build.rb` - YAML-to-JSON and YAML-to-TypeScript build script.
- `src/posts/2026-06-06-prelude-a-thing-documented-is-a-thing-not-yet-lost.md` - Entry 000 prelude (rendered to `/posts/...html`).
- `src/posts/2026-06-10-perspective-peregrines-and-pang.md` - Entry 001 field doctrine (rendered to `/posts/...html`).
- `dist/forgotten-industries.json` - generated complete archive data (not tracked).
- `dist/index.ts` - generated TypeScript module exporting the archive (not tracked).
- `AGENTS.md` - short pointer for future coding agents.
- `CLAUDE.md` - pointer to `AGENTS.md` for Claude Code.
- `ATLAS.md` - project operating identity, voice, archive priorities, and decision rules.
- `src/index.html` - raw HTML entry point, preserved.
- `src/archive.html` - raw archive index, deployed verbatim.
- `src/inventory.html` - raw inventory page, deployed verbatim.
- `src/field-log-template.html` - raw field log template, deployed verbatim.
- `src/social-posts.html` - raw HTML index for imported social posts, deployed verbatim.
- `src/about.html` - raw project origin note, preserved.
- `src/contact.html` - raw contact page, preserved.
- `src/posts/index.html` - earlier hand-curated post index, preserved (the live index is generated from the collection).
- `src/site-snapshots/github-pages-trial-2026-06-06/` - stowed copy of the pre-reset GitHub Pages trial surface.
- `src/assets/forgotten-industries.jpeg` - local Forgotten Industries logo image used by the raw HTML pages.
- `src/assets/favicon/` - favicon and web app icon assets used by the raw HTML pages.
- `src/assets/social/` - downloaded local media from imported social posts.
- `src/assets/initial-photos/` - initial local photo batch for archive intake.
- `src/posts/social/` - generated Markdown posts from imported social content, copied verbatim to `/posts/social/`.
- `src/docs/archive-photo-procedure.md` - archive photography and object intake procedure.
- `src/docs/obs-archive-station-procedure.md` - fixed-camera OBS archive station procedure.
- `src/docs/potato-dossier.md` - companion / lab partner context for Potato.
- `src/templates/field-log.md` - Markdown field log template.
- `src/templates/inventory-item.md` - Markdown inventory item template.
- `intake/SLUSH/` - working drafts and scratch material awaiting cataloging.
- `intake/Splunking/` - raw evidence photos from intake, not yet processed into the archive.

## Archive Principle

Do not trap the work inside a theme. Keep the archive durable first. The website, Ghost theme, static site, or npm package can all come later.
