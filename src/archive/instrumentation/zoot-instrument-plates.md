---
title: "Instrumentation Record — ZOOT"
date: "2026-08-28"
layout: archive-document.njk
permalink: /archive/instrumentation/zoot-instrument-plates/
category: "L’Archive / Instrumentation"
collection: "FI-INST-001 + FI-INST-002"
record_type: instrumentation
public_layer: l_archive
lifecycle_state: published
status: "published — attribution cleared by the operator, 2026-08-28"
description: "Two sequential plates of the ZOOT archive instrument in operation, seven seconds apart, documenting fragment legibility and dissolution."
---

## RECORD SCOPE

Two plates of **ZOOT** — the non-linear reading instrument at `/zoot/` — captured
in live operation on 2026-08-28. They are registered as **FI-INST-001** and
**FI-INST-002**.

This record exists because the instrument cannot be documented from its own
source. The 1,791 lines behind `/zoot/` describe a mechanism: a fragment shader,
an impulse field, a text atlas, four cross-faded photographic samplers. They do
not and cannot convey the rendered result. The plates are the only evidence of
what the instrument actually does.

**The two plates are a single exhibit and are not to be separated.** Plate 01
shows archive fragments at legible reveal. Plate 02 shows the same fragments
seven seconds later, dissolving. Either plate alone documents a surface. In
sequence they document the instrument's behaviour, which is the reason the
record was opened.

## 01. FRAGMENTS AT REVEAL // 2026.08.28 00:01:06

<div class="fi-image-pair">
  <figure class="fi-figure">
    <img src="/assets/archive/zoot-instrument-plates/01-zoot-plate-01.jpeg"
         alt="The ZOOT instrument rendering an oil-slick interference field over a radiator photograph, with archive record fragments legible in monospace type."
         width="1600"
         height="1252"
         loading="eager"
         decoding="async">
    <figcaption>FIG. 01 — FI-INST-001. Fragments at legible reveal over a dark ground.</figcaption>
  </figure>
</div>

Records surfaced in this frame: `FI-RAD-002` (EK 360 slim radiator),
`FI-HW-MB-X99-001` (MSI X99S XPOWER AC motherboard), `FI-RED-FIT-001`
(REDEEMER EK-ACF compression fittings), a Forgotten Industries typeface note,
a portable-recorder field log entry, and one recovered social record.

## 02. THE SAME FRAGMENTS DISSOLVING // 2026.08.28 00:01:13

<div class="fi-image-pair">
  <figure class="fi-figure">
    <img src="/assets/archive/zoot-instrument-plates/02-zoot-plate-02.jpeg"
         alt="The same ZOOT field seven seconds later, the interference pattern brightened and the record fragments partially dissolved into it."
         width="1600"
         height="1252"
         loading="lazy"
         decoding="async">
    <figcaption>FIG. 02 — FI-INST-002. Identical fragment set, seven seconds later, partially unresolved.</figcaption>
  </figure>
</div>

`FI-RED-FIT-001` has lost its identifier and retains only a partial label.
`FI-RAD-002` remains washed. The recovered social record, illegible in the
interval preceding this plate, has resolved to full legibility. Legibility is
not monotonic.

## METHOD

Captured by screen region capture of the live public instrument at
`forgotten-industries.net/zoot/` in Brave, five frames at three-second
intervals; frames one and three retained by operator selection. Region capture
was bounded to the page viewport, excluding browser chrome above the content
area.

Masters are retained outside the repository at
`_accession-staging/2026-08-28-zoot-instrument-plates/` at 3052 × 2388. Public
derivatives are 1600 × 1252 JPEG.

```text
27aaceb39c1b21435d8b5ccf6f02036ec4491f040db691030f36aeff27762c45  zoot-plate-01.png
1b23f472fb505d899db357d4a1a8074323e44331b68ce66439056ad94db0e1a3  zoot-plate-02.png
```

## EVIDENCE STATES

- The plates, their capture times, and their fixity hashes are
  `verified_source_fact`.
- The reading that legibility varies per fragment across the interval is
  `verified_source_fact`, supported by the two retained plates and three
  unretained frames from the same sequence.
- The observation that the field trends pale across the twelve-second window is
  `inference`. Five frames over twelve seconds cannot distinguish a drift from
  the low phase of an oscillation. A sixty-to-ninety second sample has not been
  taken.
- Whether the dissolution is a defect or the design is **not established**. The
  archive records no finding either way.

## ATTRIBUTION

ZOOT is attributed to **Tyler Etters**
(`tyleretters`, SCADUMEN). Recorded with the operator's authorization on
2026-08-28.

Two evidence states are preserved separately rather than merged:

- `operator_report` — the operator states that Tyler Etters built the
  instrument.
- `verified_source_fact` — the repository history records one commit by Tyler
  Etters touching ZOOT: `4a100249`, 2026-08-13, *"Feed Shadow Zone photos into
  ZOOT as an always-transitioning overlay"* (#129). That work is visible in
  these plates as the `uPhotoC` / `uPhotoD` overlay samplers, the second
  photographic layer cross-fading above the base.

Commit history records commits, not authorship of design. It does not capture
pairing, prior work outside this repository, squashed contribution, or the
origin of the reading model itself. The archive records both statements and
resolves neither.

Contact details for the builder are deliberately not published here.

The archive holds no finding on whether the dissolution behaviour documented
above is intended. That question belongs to the builder, not to the record.

## NOTES

Accessioned under record family `instrumentation`, introduced at FI-v2.30 to
close a gap the taxonomy already implied: the `l_archive` public layer was
defined from the outset to hold "the instruments that keep them reachable,"
but no record family existed for an instrument in operation.

## AI GENERATION CITATION

**Classification:** AI-generated synthesis.

Matthew Taylor Marx directs, reviews, and authorizes publication, and holds
final editorial authority over this record. ATLAS is the project operating
layer. The plates were captured, the repository read, the classification
drafted, and this record written through **Claude Code running the ATLAS
plugin** under the operator's direction on 2026-08-28. ATLAS is fitted to the
model, not the reverse: the council's routing, precedence, and preservation
rules are versioned in this institution's own repository, and the model supplies
force within them. The introduction of the
`instrumentation` record family and its boundary rule were the operator's
decisions; the drafting was machine work.

The observations in EVIDENCE STATES are machine readings of machine-captured
plates. The plates themselves are the source; the readings are not authority.

> Citation — *Instrumentation Record: ZOOT* (FI-INST-001, FI-INST-002).
> Forgotten Industries, L'Archive, 2026-08-28. Marx, Matthew Taylor, director
> and editor. Instrument attributed to Tyler Etters. Developed with the ATLAS
> operating layer; capture, classification, and drafting assistance from
> Claude Code (Anthropic) running the ATLAS plugin.

*Standard note: `docs/ai-generation-citation-standard.md` and
`site.aiProvenance` enumerate OpenAI ChatGPT and OpenAI Codex only. This record
was not produced by either, and has not been filed under either name. It is
filed as Claude Code running the ATLAS plugin. The standard requires amendment
to cover assisting systems it does not list.*
