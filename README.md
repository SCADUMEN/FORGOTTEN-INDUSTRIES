# Forgotten Industries

A comprehensive archive of industrial history, recovered evidence, and field documentation. This repository preserves canonical data, generates machine-readable outputs, and powers the public institution at **[forgotten-industries.net](https://forgotten-industries.net/)**.

---

## The Four-Part Spine

Navigate the archive and assembled works through our institutional structure:

| Section | Purpose |
|---------|---------|
| **[L'ARCHIVE](https://forgotten-industries.net/l-archive/)** | The preserved record: inventory, source evidence, recovered documentation, photographs, manuals, and archaeology |
| **[L'ŒUVRE](https://forgotten-industries.net/oeuvre/)** | Assembled work: dossiers, manuscripts, reports, doctrine, and provenance |
| **[LE SIGNAL](https://forgotten-industries.net/signal/)** | Incoming transmissions: blog dispatches, live updates, and field journals |
| **[À PROPOS](https://forgotten-industries.net/apropos/)** | Origin, provenance, institutional context, and contact |

---

## Quick Start

### Prerequisites
- **Node.js** 22 (pinned via `.nvmrc` and `.node-version`)
- **Ruby** (system default on macOS; for YAML processing)

### Build the Archive
```bash
npm run build
```
Generates `dist/forgotten-industries.json` and `dist/index.ts` from canonical YAML sources.

### Build the Site
```bash
npm install
npm run build:site
```
Renders the Eleventy static site to `_site/`.

### Format & Validate
```bash
npm run pretty          # Format code with Prettier
npm run sweep:metadata  # Validate metadata standards
```

---

## What's Inside

### Canonical Data (`src/data/`)
- **`projects.yml`** — Les Dossiers (case files and project records)
- **`inventory.yml`** — Machines, parts, accessories, condition, and disposition
- **`field-logs.yml`** — ATLAS reports and debriefs
- **`voice-logs.yml`** — Recorder-based field log metadata
- **`social-posts.yml`** — Imported Tumblr and Instagram records

### Generated Outputs (`dist/`)
- **`forgotten-industries.json`** — Complete archive data, machine-readable
- **`index.ts`** — TypeScript module for archive consumers

### Content & Manuscripts (`src/posts/`)
- **Les Manuscrits** — Authored works, essays, research, and documentation
- **Social Archive** — Recovered posts with local media preserved

### Technical Reference (`src/docs/`)
- Archive procedures, site architecture, metadata standards, and preservation guidelines
- See [`src/docs/`](src/docs/) for complete reference documentation

---

## Public Routes & Outputs

| Route | Content |
|-------|---------|
| `/l-archive/` | Master inventory, object records, and source evidence |
| `/oeuvre/` | Assembled dossiers, manuscripts, reports, and doctrine |
| `/signal/` | Blog dispatches and live updates |
| `/apropos/` | Contact and institutional context |
| `/archive/inventory/` | Canonical machine and part records |
| `/hang-on-to-each-other/` | Technical reference shelf: manuals and procedures |
| `/feed.xml` | Atom feed for manuscripts and updates |
| `/sitemap.xml` | Canonical site map |
| `/dist/forgotten-industries.json` | Machine-readable archive data |

---

## Update Workflow

**To add or modify archive data:**

1. Edit canonical YAML in `src/data/` (projects, inventory, field-logs, voice-logs, or social-posts)
2. Update `src/types.ts` if the data structure changes
3. Run `npm run build` to regenerate outputs
4. Inspect `dist/forgotten-industries.json` and `dist/index.ts` for correctness
5. Commit and push to `main` — GitHub Actions deploys automatically to GitHub Pages

---

## Live Integration

### Bluesky Field Dispatches
Live field notes are automatically imported from [@forgotten-industry.bsky.social](https://bsky.app/profile/forgotten-industry.bsky.social) into `/field-notes/`. Dispatches appear with engagement metrics and are cached locally.

### Recovered Social Records
Import historical Tumblr and Instagram data:
```bash
ruby scripts/import_social.rb
ruby scripts/build.rb
```

For rate-limited Instagram recovery, use browser-assisted JSON:
```bash
INSTAGRAM_RECOVERY_JSON=/path/to/instagram-recovery.json ruby scripts/import_social.rb
```

---

## Technical Stack

| Component | Purpose |
|-----------|---------|
| **Eleventy** | Static site generation |
| **Tailwind CSS 4** | Responsive design with design tokens |
| **Ruby** | YAML parsing and build automation |
| **Node.js 22** | Runtime and scripting |
| **GitHub Actions** | CI/CD and GitHub Pages deployment |
| **Prettier** | Code formatting with Tailwind class-sorting |

### Build & Deployment
- Builds trigger on every push to `main`
- Only `SCADUMEN/FORGOTTEN-INDUSTRIES` publishes to GitHub Pages
- Forks run CI validation
- Generated artifacts (`dist/`, `_site/`) are not tracked

---

## File Organization

```
src/
├── data/                      # Canonical YAML archive
│   ├── projects.yml
│   ├── inventory.yml
│   ├── field-logs.yml
│   ├── voice-logs.yml
│   └── social-posts.yml
├── posts/                     # Les Manuscrits (markdown posts)
├── _includes/                 # Eleventy layouts
├── _data/                     # Dynamic data loaders
├── css/                       # Tailwind and archive styles
└── assets/                    # Images, audio, favicons

dist/                          # Generated outputs (not tracked)
├── forgotten-industries.json
└── index.ts

scripts/
├── build.rb                   # YAML → JSON + TypeScript
└── import_social.rb           # Social media importer

src/docs/                      # Reference documentation
├── archive-photo-procedure.md
├── site-architecture-dossier.md
├── metadata-profile-v0.1.md
└── ai-generation-citation-standard.md
```

---

## Reference Documentation

All guidance and procedures are preserved in `src/docs/`:

- **`archive-photo-procedure.md`** — Field photography and cataloging process
- **`site-architecture-dossier.md`** — Navigation, tone, and component rules
- **`classification-system.md`** — Taxonomy, naming conventions, and legacy mappings
- **`metadata-profile-v0.1.md`** — Standards-aligned metadata framework
- **`ai-generation-citation-standard.md`** — Provenance format for AI-assisted content

---

## Archive Principle

**Do not trap the work inside a theme.**

- Evidence is preserved as raw HTML
- Canonical data lives in YAML
- Outputs are generated, not hand-maintained
- The archive survives the technology

---

## Publishing

The archive is not yet published as an npm package. When ready:
1. Choose final package name and license
2. Add schema validation tests
3. Add `prepublishOnly` script that runs `npm run build`
4. Publish: `npm publish --access public`

---

## Contact & Links

**Homepage:** [forgotten-industries.net](https://forgotten-industries.net/)  
**GitHub:** [github.com/SCADUMEN/FORGOTTEN-INDUSTRIES](https://github.com/SCADUMEN/FORGOTTEN-INDUSTRIES)  
**Bluesky:** [@forgotten-industry.bsky.social](https://bsky.app/profile/forgotten-industry.bsky.social)  
**Repository:** Public, MIT-friendly, preserving evidence and enabling reuse

---

> He has found what I always failed to fully grasp: my voice.  
> *My Brother's Keeper, indeed ~ Thank you, Tyler.*
