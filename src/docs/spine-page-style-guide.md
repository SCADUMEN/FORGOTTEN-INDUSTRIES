# Forgotten Industries Spine Page Style Guide

This guide records the current production pattern for the public spine pages
after the L'Œuvre and Le Signal passes.

It is a color and component map for future route work, especially À Propos. It
does not replace the broader moodboard or typeface dossier.

## Core Pattern

L'Œuvre and Le Signal are sister pages.

They share:

- a large route title
- a caption-box subtitle under the title
- a shadow-box ticker band below the hero
- three primary hero cards below the ticker
- green SYSOUT caption plates inside the ticker and cards
- a black archive field with faint grid and scan texture

The sibling rule is structural, not identical color. Each route can have its
own color temperature as long as the roles remain stable.

## Color Roles

| Token            | Hex       | Role                                                                 |
| ---------------- | --------- | -------------------------------------------------------------------- |
| `--fi-surface`   | `#020617` | Black-blue archive field, panels, ticker beds, and shadow interiors. |
| `--fi-cyan`      | `#22d3ee` | System structure: borders, rails, records, metadata, active lines.   |
| `--fi-green`     | `#4ade80` | SYSOUT: machine output, caption plates, counts, confirmed values.    |
| `--fi-magenta`   | `#e879f9` | Prompt syntax and rare operator marks. Use sparingly.                |
| `--fi-amber`     | `#fbbf24` | Warning, authored emphasis, and warm institutional accent.           |
| `--fi-gold`      | `#f59e0b` | LE SAUVEGARDER / MTM title energy and human-authored warmth.         |
| `--fi-copper`    | `#c47a3a` | Provenance, source chain, maker plate, archival custody.             |
| `--fi-paper`     | `#f7f4ef` | Readable human text when green/cyan would over-systematize copy.     |
| `--fi-paper-dim` | `#d7d0c4` | Secondary human/institutional text.                                  |

## Route Families

### L'Œuvre

L'Œuvre is assembled work. It should stay close to the default SYSOUT family.

Use:

- cyan for structure and ticker metadata
- green for output, counts, and caption plates
- magenta only as prompt syntax or faint wash
- no dominant gold shell unless a specific authored work invokes it

Current pattern:

- ticker label: green SYSOUT caption box
- ticker item meta: cyan
- ticker item body: green Space Mono output
- hero-card caption plates: right-aligned green SYSOUT

### Le Signal

Le Signal is human-authored transmission plus machine-assisted provenance. It
can carry LE SAUVEGARDER warmth while retaining ATLAS/SYSOUT captions.

Use:

- gold for title and card headings
- amber/copper for borders, shadows, and warm plate structure
- green for SYSOUT caption boxes and counts
- paper for live item prose when magenta/cyan feels too synthetic
- magenta only as a trace accent, not as primary post color

Current pattern:

- page title and card titles: gold LE SAUVEGARDER styling
- ticker/card shells: warm gold/copper shadow boxes
- caption plates: green SYSOUT
- ticker posts: gold meta plus paper body text

### À Propos

À Propos should become the provenance and institutional-context sibling, not a
second Signal page.

Recommended direction:

- copper as the route's primary accent
- amber as the secondary institutional warmth
- green for source/SYSOUT caption boxes, maker-plate values, and confirmed
  provenance facts
- cyan for structural rules, dividers, and source-chain links
- paper/paper-dim for human context and origin copy

Avoid:

- making À Propos fully gold like Le Signal unless the section is explicitly
  MTM / LE SAUVEGARDER authored testimony
- using magenta as a large surface color
- turning the page into a biography landing page

Good future page class:

```text
apropos-provenance
```

## Component Rules

### Caption Boxes

Caption boxes are the system's public instrument output.

Use green text, black interiors, and hard-edged offset shadows. On route cards,
caption boxes should be right-aligned to the card's internal text column or
card edge.

Do not use caption boxes for prose. They are labels, counts, statuses, and
machine-readable declarations.

### Ticker Bands

Ticker bands sit between the hero and the three-card directory. They summarize
the route's active shelves without replacing the cards.

Shared behavior:

- full-width shadow-box plate
- inner ruled border
- green SYSOUT label
- horizontal scroll row for compact repeated entries
- three to four items only on landing pages

L'Œuvre and Le Signal can share ticker structure, but their item colors should
remain route-specific.

### Hero Cards

The three-card grid is the route's primary navigation instrument.

Use:

- large formal labels
- one green SYSOUT plate per card
- stable card height
- centered title mass
- right-aligned SYSOUT plate

Long labels may occupy two lines, but the caption plates should remain visually
aligned across the row when possible.

## Practical Rule

When extending this to À Propos, start from the L'Œuvre/Le Signal component
structure, then switch only the color role:

```text
structure from the sibling pages
color temperature from provenance
voice from institutional context
```

A thing documented is a thing not yet lost.
