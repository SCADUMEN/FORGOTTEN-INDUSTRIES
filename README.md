# Forgotten Industries

Forgotten Industries is a public archive and evidence-based memoir about old
machines, abandoned projects, restoration work, and the records that keep them
from disappearing.

The repository is both the source archive and the buildable public site. Its
central rule is simple: preserve the source, describe what is known, and never
promote an inference into evidence merely because it sounds complete.

**[Open the public archive](https://forgotten-industries.net/)**

## The public archive

The site is organized around four public surfaces:

- **L'ARCHIVE** holds objects, photographs, provenance, inventories, and source
  records.
- **L'ŒUVRE** assembles dossiers, manuscripts, reports, and doctrine.
- **LE SIGNAL** carries field logs, dispatches, and operator or system notes.
- **À PROPOS** records authorship, institutional context, and contact paths.

Public pages generally use the ATLAS / SYSOUT instrument voice. Amber / MTM
styling is reserved for work explicitly authored through **LE SAUVEGARDER**.
Human authorship and judgment remain primary.

## Repository authority

Read these files before changing the archive:

1. `AGENTS.md` for repository rules and safety boundaries.
2. `ATLAS.md` for the local Forgotten Industries operating layer.
3. `atlas/AGENTS.md` for ATLAS cadence and rapport.
4. The nearest nested `AGENTS.md` when working inside a governed subdirectory.

The working authority is the source under `src/`, the build scripts, the test
suite, `wrangler.jsonc`, and the active GitHub Actions workflows. Design notes
under `src/docs/` may describe proposals or historical transitions; check them
against the current configuration before treating them as operational fact.

## Current architecture

Forgotten Industries currently ships as a static Eleventy archive with a small
Vite-built Continuance application. There is no application Worker and no
server-side archive state.

```text
canonical YAML + public-safe documents + curated media
                         |
                         v
                Ruby archive-data build
                         |
                         +--> dist/ machine-readable output
                         |
                         v
             Eleventy + Tailwind + Continuance
                         |
                         v
                   _site/ static site
                         |
                         v
             Cloudflare Workers Static Assets
```

Important paths:

```text
src/data/          canonical YAML ledgers and registers
src/posts/         dated Markdown posts and dispatches
src/docs/          public-safe procedures, reports, and source records
src/_includes/     Eleventy layouts and shared page structure
src/css/           Tailwind entry point, design tokens, and legacy styles
src/assets/        cleared public media, scripts, and encrypted payloads
continuance/       Vite/React Continuance interface
scripts/           build, intake, metadata, audit, and deployment instruments
tests/unit/        generated-data and public-surface checks
tests/e2e/         Playwright browser and route checks
dist/              generated archive package; do not edit by hand
_site/             generated public site; do not edit by hand
intake/            local handling boundary for raw or restricted material
work/              local runtime, model, and scratch state; never publish
```

`npm run build:site` cleans and rebuilds the generated site, builds the archive
data and Continuance bundle, compiles CSS, and runs the public-surface audit.
Production deploys `_site/` through the asset-only Worker configured in
`wrangler.jsonc`.

The active deployment workflow is `.github/workflows/deploy-worker.yml`. It
runs on `main` only for the configured canonical repository, validates the
Worker asset bundle, deploys it, and verifies both the production custom domain
and the noindex `workers.dev` boundary. GitHub Pages is retired. See
`src/docs/cloudflare-launch.md` for the dated migration and verification record.

## Local development

Requirements:

- Node.js 22 and npm 10 or newer. Node 22 is pinned in `.nvmrc` and
  `.node-version`.
- Ruby 3.3 for `scripts/build.rb`; CI uses Ruby 3.3.
- A Chromium-compatible Playwright installation for browser tests.
- `ffmpeg` and `ffprobe` only when working with recorder audio or media
  inspection.

Install JavaScript dependencies and build the complete public surface:

```bash
npm ci
npm run build:site
```

Serve the site locally:

```bash
npm run serve:site
```

`serve:site` compiles CSS once before Eleventy starts. When editing
`src/css/archive.css`, run the CSS watcher in a second terminal:

```bash
npm run watch:css
```

The main validation sequence is:

```bash
npm run pretty
npm run build:site
npm run test:unit
npm run test:e2e
```

Notes:

- `npm run pretty` rewrites files; inspect the resulting diff.
- `build:site` and `test:unit` intentionally regenerate ignored output.
- `test:unit` runs `build:site` through its npm pretest hook.
- Run `npm run audit:public` directly when checking an already-built `_site/`.
- Use `npm run worker:dry-run` to validate the Cloudflare bundle without
  deploying it.
- Do not run `npm run deploy:worker` without explicit deployment authority and
  correctly scoped Cloudflare credentials.

## Evidence policy

Every public claim should retain its evidence state. Use these categories
consistently:

- **Verified source fact:** directly supported by an identified file, hash,
  photograph, manual, inspection, measurement, or repeatable test.
- **Operator report:** a dated statement from Matthew about custody, condition,
  history, or intent. It is valid testimony, but it is not a substitute for a
  physical inspection or functional test.
- **Machine transcription:** locally generated text derived from audio. It may
  be searchable and hash-linked, but it is not listening-reviewed evidence.
- **Listening review:** a human has checked what the recording audibly says.
  This verifies the transcription against the recording; it does not
  automatically prove every statement made in the recording.
- **Inference:** a reasoned interpretation that must be labeled and linked to
  the supporting record.
- **Future work or candidate hardware:** planned, proposed, desired, or under
  consideration. Never describe it as acquired, installed, tested, or working
  until the corresponding evidence exists.

Preserve raw sources before normalization, editing, moving, transcoding, or
metadata scrubbing. Keep recovery source media read-only whenever practical,
work from copies, and record the source-to-derivative relationship. A hash
confirms byte identity; it does not establish truth, provenance by itself, or
successful listening review.

## Public and private boundary

This repository is public. Only public-safe source material belongs in Git.

Keep these local or outside the checkout:

- raw recorder audio and machine transcript contents;
- private messages, credentials, account material, home or client information,
  and unredacted provenance;
- virtual environments, model weights, tool downloads, caches, and scratch
  logs;
- raw recovery images, drive clones, and working copies of damaged media;
- generated `_site/`, `dist/`, test reports, and browser artifacts.

The existing `.gitignore` protects `intake/_transcripts/`, intake media,
generated site output, Wrangler state, environment files, Python bytecode, and
common test artifacts. `/work/` is local-only by policy and excluded from Git;
inspect `git status` before any broad staging command.

Public media has an additional location-safety requirement. Before promoting
images or video from `intake/` into `src/assets/`, preserve the source and run:

```bash
npm run scrub:exif
```

This command changes files. Review its scope first. The production build audits
the published surface and fails if GPS metadata reaches `_site/`.

## Local recorder transcription

`scripts/transcribe_local_whisper.py` transcribes explicitly selected audio
files with local Whisper. It reads but does not modify each source audio file,
computes a SHA-256 digest, and writes an atomic JSON sidecar to:

```text
intake/_transcripts/<YYYY-MM-DD>/<RECORDER_STEM>.json
```

Sidecars include machine text, segments, an absolute local source path, source
size, source hash, model information, and a transcription timestamp. They are
sensitive local derivatives and are ignored by Git.

Create the local environment under `work/` and install the transcription
dependencies:

```bash
python3 -m venv work/whisper-venv
work/whisper-venv/bin/pip install -r requirements-local-whisper.txt
```

Inspect destinations without loading Whisper or writing sidecars:

```bash
WS882_AUDIO_ROOT="/path/to/WS-882/RECORDER/FOLDER_A"
work/whisper-venv/bin/python scripts/transcribe_local_whisper.py \
  --dry-run \
  "${WS882_AUDIO_ROOT}/260803_0122.WAV" \
  "${WS882_AUDIO_ROOT}/260803_0123.WAV"
```

Run the selected transcription only after the dry run is correct:

```bash
WS882_AUDIO_ROOT="/path/to/WS-882/RECORDER/FOLDER_A"
work/whisper-venv/bin/python scripts/transcribe_local_whisper.py \
  "${WS882_AUDIO_ROOT}/260803_0122.WAV" \
  "${WS882_AUDIO_ROOT}/260803_0123.WAV"
```

The default model is `base`; downloaded model weights live in
`work/whisper-models/`. Existing sidecars are skipped unless `--overwrite` is
passed. Do not overwrite a sidecar until the prior derivative and its review
state have been preserved.

Inventory one recorder date without writing a manifest:

```bash
WS882_AUDIO_ROOT="/path/to/WS-882/RECORDER/FOLDER_A"
node scripts/manifest_audio_intake.cjs \
  --root "${WS882_AUDIO_ROOT}" \
  --date 2026-08-03 \
  --transcript-root intake/_transcripts/2026-08-03
```

The explicit transcript root must include the dated directory. The manifest
script checks sidecar presence by matching the recorder stem, hashes the source
audio independently, and prints JSON to standard output. It does **not** read
the sidecar hash or prove that the sidecar belongs to those exact source bytes.
Compare the source and sidecar hashes before promoting any transcript-derived
claim.

To preserve a local manifest, add an ignored output path explicitly:

```bash
WS882_AUDIO_ROOT="/path/to/WS-882/RECORDER/FOLDER_A"
node scripts/manifest_audio_intake.cjs \
  --root "${WS882_AUDIO_ROOT}" \
  --date 2026-08-03 \
  --transcript-root intake/_transcripts/2026-08-03 \
  --write intake/_manifests/2026-08-03.json
```

Transcription completion means only that a machine derivative exists.
Listening review and evidence promotion remain separate human decisions.

## Publishing a post

Add a dated Markdown file to `src/posts/` with at least:

```yaml
---
title: Example field log
date: 2026-08-09
description: A public-safe description of the record.
tags:
  - field-log
---
```

Then run the normal formatting, build, and validation sequence. Eleventy
generates the posts index, Atom feed, and sitemap from the collection.

## Machine-readable public outputs

- [`/dist/forgotten-industries.json`](https://forgotten-industries.net/dist/forgotten-industries.json)
  is the generated public archive dataset.
- [`/feed.xml`](https://forgotten-industries.net/feed.xml) is the public writing
  feed.
- [`/sitemap.xml`](https://forgotten-industries.net/sitemap.xml) enumerates
  discoverable public routes.

Reader responses are catalogued in `IMPRESSIONS.md`. Private source messages
remain local; only consented, public-safe summaries belong in the repository.
Security reports follow `SECURITY.md`.

## Current checkpoint and next moves

This is a dated operational checkpoint, not a permanent claim of completion.

As inspected and locally committed on 2026-08-09:

- this work began from the locally recorded `origin/main` commit `cd1fd2c`; no
  network fetch was used to prove live remote freshness;
- Cloudflare Workers Static Assets was the configured production deployment;
- the local transcript store contained 88 structurally valid Whisper JSON
  sidecars with unique hash fields, but source-byte comparison and human
  listening review were not established by that structural check;
- the ATLAS dossier included a metadata-clean public copy of the white Shiba
  Archive Docent source, with workstation paths withheld and release tests for
  byte identity and public boundaries;
- the CaseLabs Mercury S8 work recorded operator-reported preserved chassis and
  power-supply custody while final fit, electrical condition, subsystem
  behavior, and completed function remained unverified;
- `/work/`, Python bytecode, transcript sidecars, models, virtual environments,
  and scratch logs were excluded from ordinary Git staging.

Next moves:

1. Keep transcript generation, hash comparison, listening review, and public
   evidence promotion as separate recorded gates.
2. Complete the human WS-882 listening queue before treating transcript-derived
   names, events, or statements as archive evidence.
3. Confirm Google Search Console ownership, sitemap submission, and coverage in
   the authenticated account before claiming administrative indexing completion.
4. Run formatting, the full site build, unit tests, browser tests, and the public
   release audit before committing or deploying.
5. Review and push the local commit sequence only when the release boundary is
   intentional.

Corrections, provenance, and archive correspondence can be sent to
[LESAUVEGARDER@GMAIL.COM](mailto:LESAUVEGARDER@GMAIL.COM).

The archive is the art. A thing documented is a thing not yet lost.
