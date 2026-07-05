# Forgotten Industries Typeface System Dossier

Project id: `FI-PROJ-008`
Archive status: active design dossier
Public route: `/projects/typeface-system/`
Clean specimen: `/projects/typeface-system/voice-split-specimen.html`

This dossier preserves the first clear articulation of the Forgotten Industries
voice split as a type system. The current operating rule supersedes the original
split: public pages default to ATLAS / SYSOUT voice, while amber / MTM / author
voice is reserved for explicit `LE SAUVEGARDER` authorship.

It should be a dossier first, not a manual. The artifact is evidence of an
evolving design language: how the archive separates machine record, institutional
label, formal title, and human testimony. A manual can follow later when the
rules become prescriptive enough for production use.

## Source Evidence

- `intake/fi-voice-split.html _ Claude.html` - saved Claude public artifact wrapper.
- `intake/fi-voice-split.html _ Claude_files/saved_resource.html` - rendered artifact payload containing the actual type specimen.
- `src/projects/typeface-system/voice-split-specimen.html` - cleaned, archive-native specimen derived from the rendered artifact.

The raw intake remains untouched. The cleaned specimen removes the Claude
container scripts and preserves the design decision itself.

## Voice Split

| Role                    | Typeface / mode         | Use                                                                              |
| ----------------------- | ----------------------- | -------------------------------------------------------------------------------- |
| Public default          | ATLAS / SYSOUT          | Green system text for public pages, records, dossiers, posts, and route copy.    |
| System record           | Space Mono              | IDs, timestamps, status, classification, file indexes, ATLAS-generated metadata. |
| Report body             | IBM Plex Sans           | Long-form ATLAS/SYSOUT prose, systems doctrine, generated reports, AI records.   |
| Reserved author mode    | LE SAUVEGARDER          | Amber / MTM / human testimony styling only when Matthew explicitly invokes it.   |
| Historical source state | Original voice specimen | Preserved as evidence; no longer the site-wide production rule.                  |

## Decision

Use the dossier format for now.

A dossier preserves the design evolution as evidence. It can hold the artifact,
the reasoning, the open questions, and later variants without pretending the
rules are final. A manual should wait until the type system has enough repeated
use across pages, posts, field logs, and object records to justify a stable
instruction set.

## Operating Rule

The type system is not decorative. It carries authorship and source state.

- ATLAS / SYSOUT voice: metadata, classification, ATLAS output, generated
  records, route copy, dossiers, manuscripts, and public-facing operational text.
- Report body voice: long-form systems doctrine, ATLAS reports, and AI-assisted
  instrument records use `--font-report-body` so paragraphs remain readable
  while headers and labels stay Space Mono.
- LE SAUVEGARDER author voice: amber / MTM / human testimony styling only when
  explicitly invoked by Matthew.
- Historical voice split: preserved as source evidence, not treated as the
  current production default.

When uncertain, preserve the source voice before making the page look tidy.

## Open Questions

- Decide whether `FI-DS-001` should remain a specimen-only ID or become a real
  design-source record.
- Determine whether the site should expose a formal "type specimen" page outside
  the Dossiers shelf.
- Validate how the split behaves in long manuscripts, generated archive pages,
  and compact mobile views.
- Promote to a Manual only after the pattern survives multiple implemented pages.

## Recovery Note

The artifact matters because it names a structural problem that was already
present in the archive: the site needs to distinguish the machine record from
the human witness without separating them into different projects. The type
system lets both remain visible in the same case file.
