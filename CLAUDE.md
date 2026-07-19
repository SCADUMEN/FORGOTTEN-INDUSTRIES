# CLAUDE.md

Read `AGENTS.md` — it is the canonical entry point for all coding agents in this repository.

Tooling, build commands, and project structure are documented in `README.md`.

## Design

The styleguide (`/styleguide/`, rendered from `src/styleguide.njk`) is the canonical design reference — type, color tokens, components, route color families, and the heuristics that hold them together. It is rendered with the site's own classes and tokens, so it reflects what actually ships.

**Consult the styleguide for every change, of any class, that touches the rendered site** — new pages or routes, templates and partials, CSS, components, copy, and interactive/JS surfaces (including standalone apps such as CxR at `/cxr/`). Before writing markup or styles, verify against it: reuse existing tokens (`--fi-*` and the semantic aliases), components (`.fi-caption-box`, `.section-label`, `.directory-grid`, …), fonts, and route color families instead of introducing new ones. Follow its heuristics — dark `--fi-bg` field under the scan-grid, hard-edged offset shadows, no rounded corners, role-based color, caption boxes for machine output only, sentence-case prose / Title-case labels, and the shared 3px cyan focus outline.

**Keep the styleguide in sync.** Any change that adds or alters a token, component, route color family, or heuristic must update `src/styleguide.njk` in the same change, so the page never drifts from what ships.

## CxR (CONTINUANCExRESEARCH)

CxR is the interactive research instrument at `/cxr/` — a two-column surface for searching and cross-referencing archive sources two at a time (pick a source per column, one query searches both, select a record to cross-reference it against the other column). It is the operational avatar of the **CONTINUANCE** persona; the persona and its dossier remain named CONTINUANCE (`/projects/continuance/`, source `continuance.md`), while the tool is CxR.

- **Where it lives:** a Vite + React app in `continuance/` (the source folder keeps its original name; only the served route is `/cxr/`). It is a normal site page: `src/cxr.njk` renders through `base.njk` (so CxR carries the global header/footer), mounting the React app built by `npm run build:continuance`. Eleventy passthrough-copies only the built bundle (`continuance/dist/assets` with stable `cxr.js`/`cxr.css` names) and `continuance/dist/data` next to it.
- **Data:** only the FI archive is indexed at build time (`scripts/build_continuance_index.cjs` → `fi.json`). **nor and pasted URLs are fetched live in the browser** through a CORS proxy at `cors-proxy.vaporwavemall.com` (base baked in at build, overridable via `VITE_CORS_PROXY`) — nor is declared in the manifest as a runtime `feed` source with a `feedUrl` and normalized in `sources.js` (`loadFeedSource`). This is deliberate: nor's feed sits behind Cloudflare bot protection that 403s the datacenter IPs a build runs on, so a build-time fetch is unreliable; a browser fetch through the proxy is not. That proxy Worker lives in and deploys from the `vaporwavemall.com` repo, not here. State (source selections, query, pasted URLs, bookmarks) persists in localStorage under `continuance:v1:`.
- **Design:** like any rendered surface, CxR reuses the styleguide tokens/idioms — it introduces no new tokens or route families.

**Keep the CxR dossier in sync.** CxR carries its own in-app dossier (`continuance/src/components/CxrDossier.jsx`, the second disclosure in the masthead) documenting what the instrument does. Any feature change that is important to the user — a new source type, a new capability like bookmarks, a change to how cross-referencing or state works — must be reflected in that dossier in the same change, so it stays a faithful, current description of what ships.

## Media & EXIF hygiene

This repository is public, so media must never carry an embedded GPS location — the demonstrated risk is phone photos and video whose EXIF, structured XMP, or QuickTime metadata pins an exact spot such as a home or worksite.

- **Scrub before promoting.** Media dropped into `intake/` and any image or video bound for `src/assets/` are cleared of location with `npm run scrub:exif` (`scripts/scrub_exif.cjs`). The policy is GPS/location only — camera model, timestamps, and other descriptive metadata are left intact. Pass `--dry-run` to report without writing, or directory arguments to scope it.
- **The build blocks leaks.** `scripts/audit_public_surface.cjs` (run by `npm run audit:public` and the canonical `build:site`) reads every published image and video in `_site/` and fails the build if GPS, structured XMP location, or QuickTime coordinates survive. The scrubber is the fix; the audit is the backstop.
- **Intake media is ignored.** `.gitignore` excludes media anywhere under `intake/` with recursive `**` patterns, so raw photos in nested folders (e.g. `intake/Splunking/`) can never be committed. Keep those rules recursive.

Uses the `exiftool-vendored` devDependency (bundles the exiftool binary; works in CI).
