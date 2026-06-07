# Forgotten Industries

Canonical archive data, raw HTML reference pages, and an Eleventy mirror for Forgotten Industries.

The source of truth is human-readable YAML in `src/`. The build step converts that archive into package-ready outputs in `dist/`:

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

This writes the deployable site to `_site/`. The Eleventy home page mirrors the canonical domain and GitHub repository while preserving the raw HTML pages as visible reference shelves.

To view the raw HTML pages without Eleventy:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Curated Posts

The live site now starts cleanly from `index.html` and points to hand-curated posts under `posts/`.

- `posts/index.html` - curated post index.
- `posts/2026-06-06-perspective-peregrine-and-pang.html` - Entry 000 prelude draft.
- `posts/2026-06-06-perspective-peregrine-and-pang.md` - editable Markdown source for the prelude.

The visible top-level shelves are THE ARCHIVE, Recovery & Restorations, Field Lab Journal, Project Dossiers, Manuscripts, Technical References, and What About Art? The canonical category map lives in `docs/site-architecture-dossier.md`.

The old GitHub Pages trial surface is preserved at `site-snapshots/github-pages-trial-2026-06-06/`.

## Eleventy Mirror

The Eleventy source lives under `site/`:

- `site/index.njk` - generated public home page.
- `site/_includes/base.njk` - shared HTML shell.
- `site/_data/site.cjs` - domain, GitHub, contact, and identity data.
- `site/_data/archive.cjs` - reads `dist/forgotten-industries.json`.
- `site/css/archive.css` - restrained archive styling.
- `site/CNAME` - portability marker for `forgotten-industries.net`.

The existing root HTML pages remain checked in as durable, inspectable archive pages. GitHub Pages deploys the Eleventy output from `_site/`.

## Update Workflow

1. Edit `src/projects.yml`, `src/inventory.yml`, or `src/field-logs.yml`.
2. If the data shape changes, update `src/types.ts`.
3. Run `npm run build`.
4. Inspect `dist/forgotten-industries.json` for downstream consumers.
5. Inspect `dist/index.ts` for TypeScript consumers.

## Reference Docs

- `docs/archive-photo-procedure.md` - field procedure for cataloging and photographing recovered parts before cleaning, sorting, or restoration.
- `docs/obs-archive-station-procedure.md` - fixed-camera OBS procedure for fast, repeatable archive intake screenshots.
- `docs/potato-dossier.md` - companion / lab partner context for Potato's role in the archive and operating environment.
- `docs/repository-architecture.md` - public-safe repo split and naming map for `FI (src)`, `FI (pub)`, and private staging boundaries.
- `docs/site-architecture-dossier.md` - canonical top-level site spine, navigation, and category tone rules.

## Import Social Posts

```bash
ruby scripts/import_social.rb
ruby scripts/build.rb
```

The importer reads public Tumblr and Instagram data for Forgotten Industries, saves local media into `assets/social/`, writes Markdown posts into `posts/social/`, writes canonical records to `src/social-posts.yml`, and regenerates `social-posts.html`.

Tumblr currently exposes 2 public posts through its feed. Instagram reports 59 public posts, but unauthenticated access may rate-limit or require login while paginating older posts. When that happens, the importer keeps the posts it can verify and can be rerun later.

For browser-assisted Instagram recovery, scrape the profile into a JSON payload and import it explicitly:

```bash
INSTAGRAM_RECOVERY_JSON=/path/to/forgotten-instagram-recovered.json ruby scripts/import_social.rb
ruby scripts/build.rb
```

That mode preserves existing Tumblr records from `src/social-posts.yml` and rebuilds the Instagram archive from the recovered JSON.

## Publishing Later

The archive is not published yet. When it is ready to become an npm package:

1. Choose a final package name and license.
2. Add tests for schema validation.
3. Add a `prepublishOnly` script that runs `npm run build`.
4. Run `npm publish --access public` if publishing a scoped public package.

## Files

- `src/projects.yml` - canonical restoration projects and category records.
- `src/inventory.yml` - canonical machines, parts, accessories, condition, and disposition.
- `src/field-logs.yml` - canonical field logs and method notes.
- `src/social-posts.yml` - imported Tumblr and Instagram posts with source URLs, dates, captions, local media, and generated Markdown paths.
- `src/types.ts` - TypeScript schema for the generated archive.
- `scripts/import_social.rb` - public Tumblr/Instagram importer for social posts and media.
- `scripts/build.rb` - YAML-to-JSON and YAML-to-TypeScript build script.
- `eleventy.config.cjs` - Eleventy build configuration for the public mirror.
- `site/` - Eleventy source for the domain/GitHub mirror.
- `dist/forgotten-industries.json` - generated complete archive data.
- `dist/index.ts` - generated TypeScript module exporting the archive.
- `AGENTS.md` - short pointer for future coding agents.
- `ATLAS.md` - project operating identity, voice, archive priorities, and decision rules.
- `index.html` - raw HTML entry point.
- `archive.html` - raw archive index.
- `inventory.html` - raw inventory page.
- `field-log-template.html` - raw field log template.
- `about.html` - raw project origin note.
- `contact.html` - raw contact page.
- `posts/index.html` - hand-curated post index.
- `posts/2026-06-06-perspective-peregrine-and-pang.html` - Entry 000 prelude draft.
- `posts/2026-06-06-perspective-peregrine-and-pang.md` - Markdown source for the prelude.
- `social-posts.html` - raw HTML index for imported social posts.
- `site-snapshots/github-pages-trial-2026-06-06/` - stowed copy of the pre-reset GitHub Pages trial surface.
- `assets/forgotten-industries.jpeg` - local Forgotten Industries logo image used by the raw HTML pages.
- `assets/favicon/` - favicon and web app icon assets used by the raw HTML pages.
- `assets/social/` - downloaded local media from imported social posts.
- `assets/initial-photos/` - initial local photo batch for archive intake.
- `posts/social/` - generated Markdown posts from imported social content.
- `docs/archive-photo-procedure.md` - archive photography and object intake procedure.
- `docs/obs-archive-station-procedure.md` - fixed-camera OBS archive station procedure.
- `docs/potato-dossier.md` - companion / lab partner context for Potato.
- `templates/field-log.md` - Markdown field log template.
- `templates/inventory-item.md` - Markdown inventory item template.

## Archive Principle

Do not trap the work inside a theme. Keep the archive durable first. The website, Ghost theme, static site, or npm package can all come later.
