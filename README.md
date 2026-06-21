# Forgotten Industries

Canonical archive data, raw HTML reference pages, and an Eleventy site for Forgotten Industries.

All source lives in `src/`: canonical YAML in `src/data/`, the Eleventy site, curated posts, and preserved raw HTML pages. The build step converts the archive into package-ready outputs in `dist/` with machine-readable formats for downstream consumers.

- `dist/forgotten-industries.json` — Machine-readable archive data
- `dist/index.ts` — TypeScript module for archive consumers

This follows the same architectural pattern as Tyler Etters' discography repo: edit canonical YAML first, generate typed and machine-readable output second, let websites and packages consume the generated data.

> He has found what I always failed to fully grasp: my voice.
> My Brother's Keeper, indeed ~ Thank you, Tyler.

---

## Table of Contents

- [Quick Start](#-quick-start)
- [What's Inside](#-whats-inside)
- [Tooling & Architecture](#-tooling--architecture)
- [Update Workflow](#-update-workflow)
- [Live Integration](#-live-integration)
- [File Reference](#-file-reference)
- [Publishing](#-publishing-to-npm)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 24.13.0 (pinned via `.nvmrc` and `.node-version`)
- **Ruby** (for YAML parsing; available on macOS by default)

### Build the Archive Data

No `npm install` required for the archive build:

```bash
npm run build
```

Or run the Ruby converter directly:

```bash
ruby scripts/build.rb
```

### Build the Eleventy Site

```bash
npm install
npm run build:site
```

### Format Code Before Committing

```bash
npm run pretty
```

---

## 📖 What's Inside

### Archive Data Shelves

The site is organized around **L'Archive** as the primary destination, with satellite routes to projects, manuals, signals, and about pages.

- **L'ARCHIVE** — The historical record: documentation, provenance, research, old hardware references, forum archaeology, photos, part identification, manuals, diagrams, and unknown-component investigation.
- **Recoveries, Restorations, & 'Le Rédempteur'** — Machines coming back, and the human recovery that moves with them. The workbench and the soul are allowed to appear in the same post.
- **Live Dispatches** — Shortform entries from [@forgotten-industry.bsky.social](https://bsky.app/profile/forgotten-industry.bsky.social), imported via `fieldnotes.cjs` with engagement metrics.
- **ATLAS Reports** — AI-assisted end-of-day debriefs covering completed work, recovered evidence, decisions, and next actions.
- **Field Log** — Matthew's original voice entries from the portable recorder, preserved as MP3 files, listed newest first.
- **Projects** — Structured context packets for Codex, GitHub, the site, and long-running continuity. Where active builds become dossiers.
- **Le Signal** — Longer essays, reflections, memoir fragments, and finished written pieces. The writing shelf.
- **Hang On To Each Other** — Recovered instructions, procedures, references, and preservation notes for keeping abandoned systems intelligible. Manual 001 lives here.
- **What About Art?** — Creative material that belongs to the archive but does not fit cleanly under science, hardware, manuals, or restoration. The final catch-all, on purpose.

### Raw Evidence & Outputs

- `/archive.html` — Top-level archive routing: posts, snapshots, inventory, source files.
- `/inventory.html` — Canonical machine, part, accessory, condition, and disposition records.
- `/social-posts.html` — Recovered Tumblr and Instagram posts with local media and Markdown sources.
- `/dist/forgotten-industries.json` — Machine-readable archive output.
- `/site-snapshots/` — Generated snapshots of previous site architectures preserved as evidence.
- `/field-notes/` — Imported live Bluesky dispatches with engagement metrics.

---

## 🛠 Tooling & Architecture

### Development Stack

| Tool             | Version | Purpose                                                                     |
| ---------------- | ------- | --------------------------------------------------------------------------- |
| **Node.js**      | 24.13.0 | Pinned via `.nvmrc` and `.node-version`; CI reads same                      |
| **Eleventy**     | Latest  | Static site generator (CJS config: `eleventy.config.cjs`)                   |
| **Tailwind CSS** | 4       | Styles the site; design tokens via `@theme inline` in `src/css/archive.css` |
| **Prettier**     | Latest  | Code formatting with Tailwind class-sorting plugin                          |
| **Ruby**         | System  | YAML parsing and build automation                                           |

### Build & Deployment

- **GitHub Actions** builds every push to `main`
- Only the org repo (`SCADUMEN/FORGOTTEN-INDUSTRIES`) deploys to GitHub Pages
- Forks run the build as a CI check
- **Feeds & Sitemaps**: Atom feed at `/feed.xml`, sitemap at `/sitemap.xml`
- **Generated artifacts** in `dist/` and `_site/` are not tracked

### File Organization

```
src/
├── data/                    # Canonical YAML source
│   ├── projects.yml         # Restoration projects and categories
│   ├── inventory.yml        # Machines, parts, accessories, condition
│   ├── field-logs.yml       # ATLAS reports and debriefs
│   ├── voice-logs.yml       # Recorder-based Field Log metadata
│   └── social-posts.yml     # Imported Tumblr/Instagram posts
│
├── _includes/               # Eleventy layouts
│   ├── base.njk             # Shared HTML shell
│   └── post.njk             # Post layout (Tailwind utilities)
│
├── _data/                   # Dynamic data sources
│   ├── site.cjs             # Domain, GitHub, contact, identity
│   ├── archive.cjs          # Reads dist/forgotten-industries.json
│   └── fieldnotes.cjs       # Bluesky Live Dispatches importer
│
├── posts/                   # Curated Markdown posts
├── css/                     # Tailwind entry & archive styles
├── assets/                  # Images, audio, favicons
└── index.njk                # Generated home page

dist/                         # Generated outputs (not tracked)
├── forgotten-industries.json
└── index.ts

scripts/
├── build.rb                 # YAML → JSON + TypeScript
└── import_social.rb         # Tumblr/Instagram importer
```

---

## 📝 Update Workflow

**To add or modify archive data:**

1. **Edit canonical YAML** — Update `src/data/projects.yml`, `src/data/inventory.yml`, `src/data/field-logs.yml`, or `src/data/voice-logs.yml`
2. **Update types if needed** — If the data shape changes, update `src/types.ts`
3. **Build** — Run `npm run build`
4. **Inspect outputs** — Check `dist/forgotten-industries.json` and `dist/index.ts` for correctness
5. **Commit & push** — Changes deploy automatically to GitHub Pages on push to `main`

---

## 🔗 Live Integration

### Bluesky Live Dispatches

`fieldnotes.cjs` automatically imports dispatches from [@forgotten-industry.bsky.social](https://bsky.app/profile/forgotten-industry.bsky.social). Short bench notes, evidence finds, measurements, and live updates appear in the **Live Dispatches** shelf with engagement metrics cached.

### Import Social Posts from Tumblr & Instagram

```bash
ruby scripts/import_social.rb
ruby scripts/build.rb
```

Imports public Tumblr and Instagram data, downloads media to `src/assets/social/`, and writes Markdown posts to `src/posts/social/`.

**Browser-assisted Instagram recovery** (for when unauthenticated access rate-limits):

```bash
INSTAGRAM_RECOVERY_JSON=/path/to/forgotten-instagram-recovered.json ruby scripts/import_social.rb
ruby scripts/build.rb
```

This mode preserves existing Tumblr records and rebuilds Instagram from recovered JSON.

---

## 📚 Curated Posts

Posts are Markdown files in `src/posts/` with front matter (`title`, `date`, `description`, `tags`). Eleventy renders each through the post layout at `/posts/<filename>.html`.

### Current Posts

- `2026-06-06-prelude-a-thing-documented-is-a-thing-not-yet-lost.md` — Entry 000 prelude
- `2026-06-10-perspective-peregrines-and-pang.md` — Entry 001 field doctrine

Hand-written HTML versions remain in `src/posts/` as preserved artifacts.

---

## 📖 Reference Documentation

All reference docs live in `src/docs/`:

- `archive-photo-procedure.md` — Field procedure for cataloging and photographing recovered parts
- `obs-archive-station-procedure.md` — Fixed-camera OBS procedure for archive intake screenshots
- `potato-dossier.md` — Companion/lab partner context for Potato's role
- `repository-architecture.md` — Public-safe repo split and naming map
- `site-architecture-dossier.md` — Canonical site spine, navigation, and category tone rules
- `ai-generation-citation-standard.md` — Required provenance format for ATLAS, ChatGPT, and Codex assistance

---

## 📋 Manuals & Reference Shelf

### Hang On To Each Other

`/hang-on-to-each-other/` is the manual shelf: recovered instructions, procedures, and preservation references for abandoned systems.

**Manual 001**: CaseLabs Mercury S8 + Pedestal assembly reference (includes recovered PDF integrated into the reference shelf; Markdown source in `src/`).

---

## 📂 Complete File Reference

### Data & Configuration

- `src/data/*.yml` — All canonical archive data (YAML)
- `src/types.ts` — TypeScript schema for generated archive
- `src/_data/site.cjs` — Domain, GitHub, contact, identity
- `src/_data/archive.cjs` — Loads `dist/forgotten-industries.json`
- `src/_data/fieldnotes.cjs` — Bluesky importer with caching

### Build & Scripts

- `scripts/build.rb` — YAML → JSON + TypeScript converter
- `scripts/import_social.rb` — Tumblr/Instagram importer
- `prettier.config.js` — Prettier with Tailwind class-sorting
- `eleventy.config.cjs` — Eleventy configuration

### Site Files

- `src/index.njk` — Generated home page
- `src/_includes/base.njk` — Shared HTML shell
- `src/_includes/post.njk` — Post layout
- `src/css/archive.css` — Tailwind entry, design tokens, archive styling
- `src/CNAME` — DNS pointer for `forgotten-industries.net`

### Content & Posts

- `src/posts/` — Curated Markdown posts with front matter
- `src/posts/social/` — Generated Markdown from imported social content

### Raw HTML Pages (Deployed Verbatim)

- `archive.html` — Archive index and routing
- `inventory.html` — Inventory page
- `field-log-template.html` — Field log template
- `social-posts.html` — Social posts index
- `about.html` — Project origin note
- `contact.html` — Contact page

### Evidence & Snapshots

- `src/site-snapshots/github-pages-trial-2026-06-06/` — Pre-reset trial surface
- `src/site-snapshots/le-signal-three-branch-2026-06-19/` — Three-branch Le Signal surface
- `src/assets/initial-photos/` — Initial intake batch (259 files, ~839 MB, checksums recorded)
- `src/assets/social/` — Downloaded media from imported social posts
- `src/assets/audio/field-logs/` — Published Field Log MP3 recordings

### Intake & Working Space

- `intake/L-Archive/` — Local photo intake from `~/Pictures/FORGOTTEN-INDUSTRIES`
- `intake/Splunking/` — Raw evidence photos awaiting processing
- `intake/SLUSH/` — Working drafts and scratch material

### Templates & Guides

- `src/templates/field-log.md` — Markdown field log template
- `src/templates/voice-field-log.yml` — Metadata template for recorder entries
- `src/templates/inventory-item.md` — Markdown inventory item template
- `AGENTS.md` — Pointer for future coding agents
- `CLAUDE.md` — Pointer to `AGENTS.md` (for Claude Code)
- `ATLAS.md` — Project operating identity, voice, archive priorities, decision rules

### Generated Outputs (Not Tracked)

- `dist/forgotten-industries.json` — Complete archive data
- `dist/index.ts` — TypeScript module exporting archive
- `_site/` — Built Eleventy output

---

## 🎁 Publishing to npm

The archive is not yet published as an npm package. When ready:

1. Choose final package name and license
2. Add tests for schema validation
3. Add `prepublishOnly` script that runs `npm run build`
4. Run `npm publish --access public` if publishing a scoped public package

---

## 🏛️ Archive Principle

**Do not trap the work inside a theme.** Keep the archive durable first. The website, Ghost theme, static site, or npm package can all come later.

- Evidence is preserved as raw HTML
- Canonical data lives in YAML
- Outputs are generated, not hand-maintained
- The archive survives the technology

---

## 🔗 Live Site & Contact

**Homepage:** [forgotten-industries.net](https://forgotten-industries.net/)

**GitHub:** [github.com/SCADUMEN/FORGOTTEN-INDUSTRIES](https://github.com/SCADUMEN/FORGOTTEN-INDUSTRIES)

**Bluesky:** [@forgotten-industry.bsky.social](https://bsky.app/profile/forgotten-industry.bsky.social)
