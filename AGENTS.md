# AGENTS.md

Before making changes in this repository, read:

- `ATLAS.md` for the local Forgotten Industries ATLAS operating layer: shared ATLAS behavior plus archive-specific project rules.
- `atlas/AGENTS.md` for the local ATLAS rapport layer: cadence, mission-control tone, and signoff style.
- `atlas/subroutines/le-sauvegarder.md` when Matthew invokes Le Sauvegarder / Le Sauvegarde or when changing preservation-and-source-protection guidance.
- `atlas/subroutines/le-continuant.md` when Matthew invokes Le Continuant / Continuance or when changing endurance-and-maintenance guidance.
- `atlas/subroutines/le-redempteur.md` when Matthew invokes Le Redempteur / Le Rédempteur or when changing recovery-through-rebuild guidance.
- `README.md` for repository structure, tooling, build commands, and the posts workflow.

The reusable ATLAS source lives in the separate `ATLAS` repository when available. The files in this repository remain the working authority for Forgotten Industries.

Use repository instructions first, then local project guidance, then ATLAS voice and rapport. Technical correctness, safety, and preservation of the archive override tone.

## Working notes

- All source lives in `src/`: canonical YAML in `src/data/`, the Eleventy site, curated Markdown posts in `src/posts/`, and preserved raw HTML pages. `dist/` and `_site/` are generated — never edit them by hand.
- Public-facing pages default to ATLAS / SYSOUT voice: green terminal text, system labels, and instrument output. Amber / MTM / author voice styling is reserved for explicit `LE SAUVEGARDER` authorship.
- Node is pinned by `.nvmrc` and `.node-version` (22); `package.json` engines allow `>=22`. Build the site with `npm run build:site`; serve locally with `npm run serve:site`.
- `serve:site` compiles CSS once before serving; Eleventy's watch does not rebuild `src/css/archive.css`. When editing CSS during a serve session, run `npm run watch:css` in a second terminal to recompile on save.
- Run `npm run pretty` before committing. Prettier must pass repo-wide.
- To publish a post, add a dated Markdown file with front matter (`title`, `date`, `description`, `tags`) to `src/posts/` and rebuild. The post index, Atom feed (`/feed.xml`), and sitemap are generated from the collection.
- Style new components with Tailwind utilities backed by the `@theme inline` tokens in `src/css/archive.css` (`text-oxide`, `font-headline`, ...). Legacy classes remain for existing pages.
- Deploys go through GitHub Actions to Cloudflare Workers Static Assets, only
  from `SCADUMEN/FORGOTTEN-INDUSTRIES` `main`; GitHub Pages is retired.
- Public media must never carry a GPS location. Scrub images and video in `intake/` and `src/assets/` with `npm run scrub:exif` before promoting or committing; `npm run build:site` runs the public-surface audit and fails if any published media in `_site/` still has GPS metadata. See CLAUDE.md "Media & EXIF hygiene".
