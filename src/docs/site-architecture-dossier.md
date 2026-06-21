# Forgotten Industries Site Architecture Dossier

## Purpose

This dossier records the current public architecture for Forgotten Industries.
It is a classification map for the public institution and the source tree that
supports it.

Forgotten Industries should read as a preserved institution: evidence first,
interpretation after, with art emerging through naming, sequence, authored
records, and restraint.

## Canonical Public Spine

```text
L'ARCHIVE / L'ŒUVRE / LE SIGNAL / À PROPOS
```

| Route         | Public name | Role                                                                        |
| ------------- | ----------- | --------------------------------------------------------------------------- |
| `/l-archive/` | L'ARCHIVE   | Master record, inventory, object records, source evidence, process records. |
| `/oeuvre/`    | L'ŒUVRE     | Assembled work layer.                                                       |
| `/signal/`    | LE SIGNAL   | Authored dispatches, field logs, essays, reports, and live updates.         |
| `/apropos/`   | À PROPOS    | Origin, maker plate, institutional context, provenance, and contact.        |

Do not move Dossiers, Manuscripts, manuals, posts, projects, or field logs into
the top navigation. They remain shelves inside the four public doors.

## Public Taxonomy

### L'Archive

L'Archive is the master record. It contains the evidence and the systems that
make evidence reachable.

Use this layer for:

- inventory records
- object and component records
- source sets
- recovered social evidence
- taxonomy and status shelves
- process records
- ATLAS report archive views
- technical references and recovered manuals
- provenance, uncertainty, custody, and verification state

The canonical public landing route is `/l-archive/`.

Implementation note: `src/archive.njk` intentionally remains the Eleventy source
file for `/l-archive/`. The filename is legacy implementation language, not a
public canonical route.

### L'Œuvre

L'Œuvre is the assembled work layer. It gathers finished or actively assembled
works without making the site feel like a portfolio.

It has two public shelves:

- **Les Dossiers**: living case files assembled from archive records, field logs,
  photographs, inventories, and observations.
- **Les Manuscrits**: authored works, research papers, doctrines, essays, and
  complete texts emerging from the archive.

Implementation notes:

- `src/data/projects.yml`, `archive.projects`, `/projects/`, and
  `/archive/projects/` remain for schema and URL compatibility. Public labels
  should say Dossier or Dossiers unless the text is explicitly describing a
  legacy data field or ID.
- `src/posts/`, `collections.posts`, and `/posts/` remain for Eleventy
  collection, feed, and URL compatibility. Public labels should say Manuscript,
  Manuscripts, or Les Manuscrits.

### Le Signal

Le Signal is the transmission layer. It carries time-based authored records and
operational dispatches.

Use this layer for:

- ATLAS reports
- recorder-based Field Logs
- imported Bluesky dispatches
- short updates
- essays and authored transmissions when they are presented as signal rather
  than assembled works

### À Propos

À Propos is the institutional context layer.

Use this layer for:

- origin and authorship
- contact
- maker plate and provenance language
- citation standards
- project method and institutional context

## Legacy Route Policy

Compatibility wins over purity.

| Route or name             | Current handling                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------ |
| `/archive/`               | Compatibility route to `/l-archive/`. Do not use as canonical in new public links.               |
| `/archive.html`           | Compatibility route to `/l-archive/`. Kept for old links and preserved references.               |
| `/archive/*`              | Kept for generated archive shelves, object records, taxonomy, source sets, and evidence ledgers. |
| `/projects/`              | Kept as the public Les Dossiers shelf. It is not a top-nav item.                                 |
| `/posts/`                 | Kept as the public Les Manuscrits shelf and feed source. It is not a top-nav item.               |
| `/hang-on-to-each-other/` | Kept as a named technical-reference/manual shelf inside the archive.                             |

Do not create duplicate competing archive pages. If an older route exists for
compatibility, point it to the canonical door or document why it remains an
archive shelf.

## Naming Rules

- Use **L'Archive** for the master record and public archive door.
- Use **Dossier/Dossiers** for institution-facing assembled case files.
- Use **Project/project** only for source fields, legacy IDs, code paths, or
  historical records that genuinely use that term.
- Use **Manuscript/Manuscripts** for public authored works.
- Use **post/posts** only for Eleventy implementation, file paths, preserved raw
  source, or historical social records.
- Use **Manual 001** and **manual** when referring to the actual recovered
  technical reference artifact.
- Use **source** when referring to provenance, source files, source sets,
  source-code repositories, or raw evidence.

## Tone

The desired register remains:

```text
70% archive / 30% art
```

The site should feel institutional, evidentiary, and restrained. Avoid pitch
copy, portfolio framing, manifesto expansion, and decorative art language unless
the page is explicitly an authored manuscript.
