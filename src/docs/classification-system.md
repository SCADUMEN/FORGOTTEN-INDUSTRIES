# FI-v2.29 Classification System

Status: working Forgotten Industries authority

Machine-readable source: `src/data/taxonomy.yml`

## Convergence Rule

Forgotten Industries defines and tests its own filing language before mapping it
to Dublin Core, DACS, PREMIS, PROV-O, RiC-O, or another established system.
Those standards may later provide interoperability and export rules; they do not
choose the institution's first names, shelves, or evidence distinctions.

The local order is:

```text
FI public layer -> FI record family -> FI evidence state -> FI lifecycle
                                           |
                                           v
                              descriptive source vocabulary
                                           |
                                           v
                                later external crosswalk
```

## Canonical Spine

The public institution is organized by four doors:

```text
/l-archive/  L'ARCHIVE
/oeuvre/     L'ŒUVRE
/signal/     LE SIGNAL
/apropos/    À PROPOS
```

These are the public navigation surfaces. Do not add Dossiers, Manuscripts,
manuals, posts, projects, field logs, or source sets to the top navigation.

## Public Layers

| Public layer | Contains                                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| L'Archive    | Master record, inventory, object records, source evidence, recovered social evidence, process records, taxonomy, technical references. |
| L'Œuvre      | Assembled works: Les Dossiers, Les Manuscrits, Les Rapports, La Doctrine, and La Provenance.                                           |
| Le Signal    | Incoming transmissions: Le Blog, En Direct, and recorder-based voice field journals.                                                   |
| À Propos     | Origin, maker plate, institutional context, provenance, citation practice, contact.                                                    |

Every public record belongs to one of these four institutional layers. Private
staging is an access state, not a fifth public door.

## Record Families

The controlled record families are:

```text
dossier
object
component
manuscript
atlas_report
field_log
voice_log
social_evidence
source_set
process_record
provenance_record
technical_reference
archive_box
file
manifest
```

Record family answers what the record is. It does not answer what the record is
about, whether it is true, whether it is public, or whether the underlying
object works.

## Evidence States

Use one or more explicit evidence states at claim level where necessary:

```text
verified_source_fact
operator_report
machine_transcription
listening_review
inference
future_work
```

Evidence state is not lifecycle. A published page can contain a labeled
inference; a draft can contain verified source facts. Listening review verifies
what audio audibly says, not every claim spoken in the recording.

## Lifecycle

Use `lifecycle_state` only for the record's archive or publication stage:

```text
intake
draft
active
provisional
verified
published
archived
superseded
restricted
quarantine
retired
```

Physical condition, functional state, custody, access, and the next repair step
remain separate fields or notes.

The existing `lifecycle` arrays on accessioned inventory are dated event
histories, not stage values. Preserve them. `lifecycle_state` is deliberately a
separate scalar field.

## Discovery Vocabulary

The existing category, tag, system, and status-note indexes remain public and
searchable, but they are not controlled axes:

- Categories currently mix object classes, record lanes, platforms, and
  dossier language.
- Tags include deliberate FI themes alongside recovered social hashtags.
- Systems carry named machine and operating contexts from source records.
- Existing `status` strings often combine lifecycle, condition, custody,
  verification gaps, and next actions. Preserve that prose as a source state
  note until those facets are separated.

Do not silently merge spellings or rewrite preserved source vocabulary. Record
aliases and migrations explicitly after repeated terms have been reviewed.

## Migration Map

| Older name                            | Decision                           | Notes                                                                                                                                              |
| ------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `archive`                             | Keep internally.                   | `src/archive.njk` renders canonical `/l-archive/`; `/archive/*` remains for archive shelves.                                                       |
| `/archive/`                           | Redirect/compatibility route.      | Prefer `/l-archive/` in canonical URLs and new public links.                                                                                       |
| `/archive.html`                       | Redirect/compatibility route.      | Kept for old public links and preserved references.                                                                                                |
| `projects`, `project`                 | Keep internally; relabel publicly. | Data keys, routes, and IDs remain stable. Public language is Dossier/Dossiers.                                                                     |
| `/projects/`                          | Keep public route.                 | It is the Les Dossiers shelf under L'Œuvre, not a top-nav item.                                                                                    |
| `posts`                               | Keep internally; relabel publicly. | Eleventy collection and feed behavior depend on it. Public language is written records generally, with Manuscripts and Doctrine as public shelves. |
| `/posts/`                             | Keep public route.                 | It is the Les Manuscrits shelf under L'Œuvre, not a top-nav item. Doctrine-classified posts are filed under `/doctrine/`.                          |
| `/blog/`                              | Keep public route.                 | It is the filtered Le Blog shelf under Le Signal, excluding doctrine-classified manuscripts.                                                       |
| `/atlas/`                             | Keep public route.                 | It is the Les Rapports shelf under L'Œuvre, not a top-nav item.                                                                                    |
| `/doctrine/`                          | Keep public route.                 | It is the La Doctrine shelf under L'Œuvre, not a top-nav item.                                                                                     |
| `/provenance/`                        | Keep public route.                 | It is the La Provenance shelf under L'Œuvre and remains linked from the maker plate.                                                               |
| `manuals`, `Manual 001`, `Manual 002` | Keep where literal.                | Manual language is correct for recovered technical-reference artifacts.                                                                            |
| `hang-on-to-each-other`               | Keep.                              | Named technical-reference shelf; do not promote to top nav.                                                                                        |
| `source`                              | Keep where evidentiary.            | Source sets, source assets, source code, and provenance use this term intentionally.                                                               |

## Implementation Notes

- Compatibility routes should never become competing canonical pages.
- Object record URLs remain under `/archive/objects/*`.
- Archive dossier record URLs remain under `/archive/projects/*` for
  compatibility, even though the public label is Dossier.
- Manuscript URLs remain under `/posts/*`; ATLAS report URLs remain under
  `/field-logs/*`; voice field journal URLs remain under `/field-logs/` where
  already published.
- Preserved raw evidence should not be renamed to satisfy taxonomy polish.
- New or materially revised index records should receive `record_type` and
  `public_layer` before new controlled axes are added.
- Absence of an evidence-state or lifecycle assignment remains visible. Do not
  infer one merely because a record is currently reachable on the public site.
- The external metadata profile in `metadata-profile-v0.1.md` is a deferred
  crosswalk over this authority, not a replacement for it.

## Public Label Rules

- Prefer **Dossier** over **Project** for visible archive/oeuvre case files.
- Prefer **Les Manuscrits** over **Posts** for authored works.
- Keep **Project** when the text is about a source key such as
  `associated_project`, a legacy ID such as `FI-PROJ-001`, or a historical
  record that used the word.
- Keep **Manual** when referring to Manual 001, Manual 002, or actual recovered technical
  manuals.
