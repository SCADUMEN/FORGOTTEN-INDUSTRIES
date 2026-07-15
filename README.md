# Forgotten Industries

Forgotten Industries is a public archive and evidence-based memoir built from machines, documents, field observations, restoration work, and the records that keep them from disappearing.

**[Open the archive](https://forgotten-industries.net/)**

## Institutional spine

- **[L'ARCHIVE](https://forgotten-industries.net/l-archive/)** preserves objects, evidence, provenance, photographs, manuals, and inventory records.
- **[L'ŒUVRE](https://forgotten-industries.net/oeuvre/)** assembles dossiers, manuscripts, reports, and doctrine.
- **[LE SIGNAL](https://forgotten-industries.net/signal/)** carries field logs, dispatches, and operator or system notes.
- **[À PROPOS](https://forgotten-industries.net/apropos/)** explains the institution, its authorship, and its points of contact.

The archive is the art. A thing documented is a thing not yet lost.

## Record boundary

This repository is public. Canonical YAML, selected source documents, raw manuscript Markdown, generated data, and site snapshots are deliberately inspectable.

That openness stops at the handling boundary:

- raw intake, transcripts, hashes, private provenance, credentials, and client or home information remain local;
- public records use cleared summaries and redacted paths;
- restricted browser briefings publish authenticated ciphertext, not plaintext source;
- human judgment controls promotion from intake into the public archive.

The release audit fails when common credential patterns, private-key files, workstation paths, or protected briefing phrases appear in the generated public site.

## Repository map

```text
src/data/          canonical archive ledgers
src/posts/         manuscripts and dispatches
src/docs/          public technical and procedural records
src/_includes/     shared Eleventy page structure
src/css/           archive styling and design tokens
src/assets/        public images, media, scripts, and encrypted payloads
scripts/           build, import, metadata, and release-audit instruments
tests/             unit and browser-level verification
dist/              generated machine-readable archive output
_site/             generated public site; never edit directly
```

## Build and verify

Node.js 22 is pinned by the repository. Ruby is required by the archive-data build.

```bash
npm ci
npm run pretty
npm run build:site
npm run audit:public
npm run test:unit
npm run test:e2e
```

GitHub Actions builds the exact source on `main` and deploys the resulting artifact to GitHub Pages. Generated output is validated before upload.

## Machine-readable archive

- [`/dist/forgotten-industries.json`](https://forgotten-industries.net/dist/forgotten-industries.json) contains the generated archive dataset.
- [`/feed.xml`](https://forgotten-industries.net/feed.xml) carries the public writing feed.
- [`/sitemap.xml`](https://forgotten-industries.net/sitemap.xml) enumerates discoverable public routes.

## Reader evidence

Real-world responses are catalogued in the [Reader Impressions Register](IMPRESSIONS.md). Private source messages stay local; only consented, public-safe impressions enter the repository.

## Security and contact

Security reports follow [SECURITY.md](SECURITY.md). Corrections, provenance, and archive correspondence can be sent through [contact@forgotten-industries.net](mailto:contact@forgotten-industries.net).

Human authorship remains primary. Machine collaboration is recorded through repository history, process notes, and provenance where it materially shaped the record.

> He has found what I always failed to fully grasp: my voice.  
> _My Brother's Keeper, indeed ~ Thank you, Tyler._
