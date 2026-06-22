# FI-v2.29 Classification System

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

## Taxonomy

| Public layer | Contains                                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| L'Archive    | Master record, inventory, object records, source evidence, recovered social evidence, process records, taxonomy, technical references. |
| L'Œuvre      | Assembled works: Les Dossiers and Les Manuscrits.                                                                                      |
| Le Signal    | Authored dispatches, ATLAS reports, recorder field logs, imported live updates, essays as transmissions.                               |
| À Propos     | Origin, maker plate, institutional context, provenance, citation practice, contact.                                                    |

## Migration Map

| Older name                            | Decision                           | Notes                                                                                              |
| ------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------- |
| `archive`                             | Keep internally.                   | `src/archive.njk` renders canonical `/l-archive/`; `/archive/*` remains for archive shelves.       |
| `/archive/`                           | Redirect/compatibility route.      | Prefer `/l-archive/` in canonical URLs and new public links.                                       |
| `/archive.html`                       | Redirect/compatibility route.      | Kept for old public links and preserved references.                                                |
| `projects`, `project`                 | Keep internally; relabel publicly. | Data keys, routes, and IDs remain stable. Public language is Dossier/Dossiers.                     |
| `/projects/`                          | Keep public route.                 | It is the Les Dossiers shelf under L'Œuvre, not a top-nav item.                                    |
| `posts`                               | Keep internally; relabel publicly. | Eleventy collection and feed behavior depend on it. Public language is Manuscripts/Les Manuscrits. |
| `/posts/`                             | Keep public route.                 | It is the Les Manuscrits shelf under L'Œuvre, not a top-nav item.                                  |
| `manuals`, `Manual 001`, `Manual 002` | Keep where literal.                | Manual language is correct for recovered technical-reference artifacts.                            |
| `hang-on-to-each-other`               | Keep.                              | Named technical-reference shelf; do not promote to top nav.                                        |
| `source`                              | Keep where evidentiary.            | Source sets, source assets, source code, and provenance use this term intentionally.               |

## Implementation Notes

- Compatibility routes should never become competing canonical pages.
- Object record URLs remain under `/archive/objects/*`.
- Archive dossier record URLs remain under `/archive/projects/*` for
  compatibility, even though the public label is Dossier.
- Signal/manuscript URLs remain under `/posts/*` and `/field-logs/*` where
  already published.
- Preserved raw evidence should not be renamed to satisfy taxonomy polish.

## Public Label Rules

- Prefer **Dossier** over **Project** for visible archive/oeuvre case files.
- Prefer **Les Manuscrits** over **Posts** for authored works.
- Keep **Project** when the text is about a source key such as
  `associated_project`, a legacy ID such as `FI-PROJ-001`, or a historical
  record that used the word.
- Keep **Manual** when referring to Manual 001, Manual 002, or actual recovered technical
  manuals.
