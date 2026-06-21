# AI Generation Citation Standard

> This standard has been consolidated into the public
> [Provenance record](/provenance/#citation-standards). This source document is
> preserved for durable reference and route compatibility.

Status: active

Authority: Matthew Taylor Marx / Forgotten Industries

Applies to: public site, ATLAS Reports, curated entries, generated summaries,
repository documentation, and future AI-assisted derivatives

## Purpose

AI assistance is process provenance. It does not replace authorship, source
citations, factual verification, or the canonical archive record.

Every disclosure must distinguish:

- the human who directed, reviewed, corrected, and authorized publication;
- ATLAS, the Forgotten Industries project operating layer;
- OpenAI ChatGPT, when used for generation, synthesis, organization, or
  editorial development;
- OpenAI Codex, when used for repository implementation, transformation,
  testing, or publication work;
- the source material from which the output was prepared.

## Classification Levels

### AI-generated synthesis

Use when the published wording or structure was substantially generated from
operator-provided context or canonical archive records. All ATLAS Reports use
this classification.

### AI-assisted editorial collaboration

Use when Matthew remains the primary writer and AI systems assist development,
organization, revision, or editing. Curated entries carry this classification
when applicable.

### AI-assisted technical implementation

Use for site architecture, code, data transformation, testing, and deployment
work performed through Codex under Matthew's direction.

## Required Content-Level Footnote

Each AI-generated or AI-assisted work must state:

1. classification;
2. Matthew's role and final editorial authority;
3. ATLAS's role;
4. ChatGPT's role, when applicable;
5. Codex's role, when applicable;
6. title, collection, publisher, and date;
7. a link to the site colophon and this standard.

## ATLAS Report Format

```text
AI-generated synthesis with human direction and review.

[Disclosure of human authority and system roles.]

Citation: Matthew Taylor Marx, director and editor. “Title.” ATLAS Report,
generated with ATLAS through OpenAI ChatGPT; repository publication assisted
by OpenAI Codex. Forgotten Industries, YYYY-MM-DD.
```

## Curated Entry Format

```text
AI-assisted editorial collaboration.

[Disclosure of human authorship and system roles.]

Citation: Matthew Taylor Marx, author and editor. “Title.” AI-assisted
editorial collaboration with ATLAS and OpenAI ChatGPT; repository publication
assisted by OpenAI Codex. Forgotten Industries, YYYY-MM-DD.
```

## Site-Level Footnote

Every generated page carries a footer disclosure identifying Matthew as the
director, reviewer, and publication authority; ATLAS as the operating layer;
ChatGPT as editorial synthesis assistance; and Codex as repository
implementation and verification assistance.

## Evidence Rule

AI output is never treated as independent source evidence. Claims still depend
on canonical YAML, source documents, photographs, recordings, external source
links, tracked commits, and Matthew's review. When system or model details are
unknown, cite only the verified product or operating-layer name. Do not invent
model versions.
