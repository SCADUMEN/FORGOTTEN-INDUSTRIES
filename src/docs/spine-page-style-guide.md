# Forgotten Industries Spine Page Style Guide

This guide records the current production pattern for the public spine pages
after the L'Œuvre and Le Signal passes.

It is a color and component map for future route work, especially À Propos.

## Which Document Wins

Four documents describe the archive's design, and they had no stated order.
When they disagree, resolve in this order:

1. **`src/styleguide.njk`** (`/styleguide/`) is canonical. It is rendered with
   the site's own classes and tokens, so it shows what actually ships. Any
   change that adds or alters a token, component, route color family, or
   heuristic updates it in the same change.
2. **This guide** owns the spine route families — the per-route color
   temperature, the ticker/hero-card structure, and the component rules below.
   Where it names a token, the styleguide's definition governs.
3. **`frontend-moodboard.md`** is direction and reference, not specification.
   It never overrides 1 or 2.
4. **The typeface dossier** (`/projects/typeface-system/`, FI-PROJ-008) is a
   design-evolution case file. It records how the voice system arrived at its
   current state; it is history and rationale, not a live spec.

A rule that exists only in 3 or 4 is a proposal. It becomes binding when it
lands in 1 or 2.

## Core Pattern

L'Œuvre and Le Signal are sister pages.

They share:

- a large route title
- a caption-box subtitle under the title
- a shadow-box ticker band below the hero
- a primary hero-card grid below the ticker, one card per public shelf
- green SYSOUT caption plates inside the ticker and cards
- a black archive field with faint grid and scan texture

The sibling rule is structural, not identical color. Each route can have its
own color temperature as long as the roles remain stable.

### Card count follows the shelves

The card grid carries **one card per public shelf on that route**, as defined by
the site architecture dossier. The count is an outcome, not a constraint.

This rule replaces an earlier fixed three-card rule. That rule silently
outranked the dossier: L'Œuvre was specified with five shelves and had three
slots, so Les Manuscrits and La Provenance were dropped from the route and
became orphaned pages reachable only by stray link. A layout constraint must
never decide which shelves exist.

When a route's shelf count changes, the grid changes with it. Compose the row
break deliberately rather than letting cards wrap ragged — L'Œuvre's five sit
on a 6-column field as 2+2+2 over 3+3.

## Color Roles

| Token            | Hex       | Role                                                                  |
| ---------------- | --------- | --------------------------------------------------------------------- |
| `--fi-surface`   | `#020617` | Black-blue archive field, panels, ticker beds, and shadow interiors.  |
| `--fi-cyan`      | `#22d3ee` | System structure: borders, rails, records, metadata, active lines.    |
| `--fi-green`     | `#4ade80` | SYSOUT: machine output, caption plates, counts, confirmed values.     |
| `--fi-magenta`   | `#e879f9` | Prompt syntax and rare operator marks. Use sparingly.                 |
| `--fi-amber`     | `#fbbf24` | Warning, authored emphasis, and warm institutional accent.            |
| `--fi-gold`      | `#f59e0b` | LE SAUVEGARDER / MTM title energy and human-authored warmth.          |
| `--fi-copper`    | `#c47a3a` | Provenance, source chain, maker plate, archival custody.              |
| `--fi-silver`    | `#c0c0c0` | Steel/silver institutional register, durable plates, quiet authority. |
| `--fi-paper`     | `#f7f4ef` | Readable human text when green/cyan would over-systematize copy.      |
| `--fi-paper-dim` | `#d7d0c4` | Secondary human/institutional text.                                   |

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

- maroon/burgundy as the route's primary accent
- silver/steel for the route title, institutional plates, and durable
  authority
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
- landing-page tickers summarize the route's shelves; the row scrolls, so the
  item count follows the shelves rather than a fixed cap

L'Œuvre and Le Signal can share ticker structure, but their item colors should
remain route-specific.

### Hero Cards

The hero-card grid is the route's primary navigation instrument. It carries one
card per public shelf; see "Card count follows the shelves" above.

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
