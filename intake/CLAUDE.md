# L'ARCHIVE Accession Log — Project Context

This is a running hardware inventory for Matthew (Forgotten Industries / L'ARCHIVE project). The log file is `intake/larchive-accession-log.md`, sequential entries numbered LA-0001 through LA-0017 so far. Continue the sequence — do not renumber existing entries.

Repository authority comes first: `AGENTS.md` at the repository root is the canonical entry point, and `ATLAS.md` governs the local operating layer. This file is narrower guidance for maintaining the accession log specifically, and does not override either.

## What this is

Matthew photographs hardware as he finds it (CPUs, boards, RAM, drives, GPUs). Each item gets logged as evidence is confirmed — from photos, from Matthew's direct statements, or later from bench testing (BIOS, `dmidecode`, `smartctl`, `nvme id-ctrl`, etc.).

## Entry format

Each entry follows this shape:

```
## LA-00XX

**Date logged:** YYYY-MM-DD
**Item:** short identity line
**Provenance:** how/where it was found, and by whom it's attested

**Verified from [photo/die/label] (photo: IMG_XXXX):**
- bullet list of exactly what's legible/confirmed

**Condition:** physical state, tested or not

**Next action:** what would close out any open question, or "None."

---
```

Some entries add extra labeled sections (`CPU installed`, `RAM history`, `Flag`, etc.) when the item has multiple parts or an open discrepancy. Follow that pattern — add a labeled section rather than cramming unrelated facts into `Condition`.

## Core discipline — do not relax this

- **Distinguish verified evidence from testimony.** Anything read directly off a label/die/photo is fact. Anything Matthew states from memory is testimony — mark it as his statement (e.g., "per Matthew," "IIRC," "stated, not confirmed"). Never silently upgrade testimony to fact.
- **Update, don't duplicate.** If new photos or info concern a physical item already logged, edit that entry (note what changed and why) rather than creating a new LA-#### for the same object.
- **Cross-reference, don't isolate.** When two entries concern parts of the same system (a CPU and its board, a RAM kit split across two boards, a waterblock and the card it fits), note the LA-#### of the related entry in both directions.
- **Flag discrepancies plainly; don't resolve by guessing.** If two pieces of evidence conflict (a label reads one thing, Matthew says another; a photo shows something unexpected), write the discrepancy into the entry and leave it open. Only close a flag when new evidence or Matthew's direct confirmation resolves it — and say which happened.
- **No compatibility/build-fit analysis unless asked.** Current mode is pure cataloging — identity, specs, condition, provenance. Matthew has a lot of hardware and will sort builds later. Don't volunteer socket/chipset compatibility judgments.
- **EXIF/metadata:** the upload pipeline strips DateTimeOriginal/CreateDate from photos — don't expect timestamps to be recoverable. Filename sequence numbers (IMG_XXXX) are a weak but usable proxy for chronology when it matters, and Matthew can confirm ordering directly.
- **Photos referenced by filename**, not reproduced or described in exhaustive prose — cite the IMG_#### that supports each claim.

## Redaction — this copy is public

This repository is public, so the tracked copy of the log is redacted. Drive PSIDs, drive and module serial numbers, WWN/EUI64 identifiers, and vendor asset tags are replaced with `[withheld — private register]`, following the convention already stated in `src/data/inventory.yml` that serial numbers remain in the private register. Model numbers, part numbers, S-Spec codes, date codes, PCB revisions, and batch markings are retained — those establish catalog identity and are published throughout the inventory anyway.

When adding an entry here, apply the same rule at the point of writing. The unredacted master stays in Matthew's local working copy, outside the public tree; restore a withheld value into this file only on his deliberate instruction.

## Relationship to the site accession pipeline

`LA-####` is a raw intake sequence, distinct from the site accession numbering (`ACCESSION 0XX`) and the durable object IDs (`FI-HW-…`) in `src/data/inventory.yml`. Do not conflate the two. An `LA-####` entry is a candidate for accession, never an accession itself.

The mapping between the two registers lives in `src/docs/intake/2026-08-27-larchive-accession-crosswalk.md`. Read it before logging anything that might already be a known object — eight raw entries already correspond to `FI-` records.

Promotion of an `LA-####` entry to a site accession is a separate, evidence-bound step requiring per-object photograph sets under `src/assets/archive/objects/`. Matthew's operator working copy holds the established pattern at `work/accession-009-fi-hw-mb-x99-001/`; that directory is **not** present in this repository, so do not attempt a promotion from here without it.

## Voice

Matthew calls this assistant persona "ATLAS" — calm, direct, technically precise, no hype, no empty praise, short paragraphs over bullet-heavy responses outside the log itself. Confirm what's known, flag what's uncertain, state the next concrete step. See his full style preferences if available in the environment; if not, the log entries themselves are the clearest example of the register to match.

## Open items as of 2026-08-27

Bench work still outstanding:

- **LA-0004** (Samsung SSD, 870 QVO-or-EVO labelling conflict) — confirm model/capacity via `smartctl -a` or OS disk info.
- **LA-0005** (Samsung 990, likely EVO Plus per Matthew) — confirm exact model string via `nvme id-ctrl` or `smartctl -a`.
- **LA-0006** (i5-2300 board, Corsair XMS3 installed) — log RAM capacity if sticks are pulled; log boot status if tested.
- **LA-0008** (mystery DDR4) + **LA-0010** (MSI X99S XPOWER AC) — the bench/POST test was planned for 2026-08-26 and is not recorded as done. Once it posts, log what BIOS reports for the DDR4 module in LA-0008 and update accordingly. This also closes the inferred capacity and speed on `FI-HW-MEM-001`.
- **LA-0011** (Kingston HyperX Genesis pair) — Module 2's capacity/speed could be independently confirmed via `dmidecode --type 17` or BIOS if it matters beyond the stated pairing.
- **LA-0012** (Corsair Vengeance LP) — this is one stick of a stated 2-stick kit; the matching second stick hasn't been located/photographed.
- **LA-0016** area — an Intel Pentium retail box + stock cooler was glimpsed in the background of IMG_3818 (same storage bin as the GPU waterblock) but never logged. Needs its own clean photo.
- **LA-0017** (EK monoblock) — fitment is now settled against the canonical record as EK-FB ASUS M6I for the Maximus **VI** Impact, not the VII. A direct photograph showing a printed model number would convert that from reference-based to label-verified.

Closed on 2026-08-27 by the canonical record, not by new bench evidence:

- **LA-0017** fitment — reassigned from the Maximus VII Impact to the Maximus VI Impact (`FI-HW-BLOCK-Z87-001`).
- **LA-0016** block manufacturer — EK (EK-FC670 GTX); the Koolance branding is on the fittings only.
- **LA-0015** board revision — Rev. 1.02 per `FI-HW-MB-Z97-001`.

Raised on 2026-08-27 against the canonical record, unresolved — see the crosswalk for detail:

- `FI-HW-MEM-002` describes both Genesis modules as having blue heat spreaders; LA-0011 records that Module 2's was removed.
- `FI-HW-MEM-003` carries the Corsair XMS3 pair as "in hand"; LA-0006 places both modules installed in the LGA1155 board.
- `FI-HW-MB-X99-001` notes record loose HyperX Fury and Corsair Vengeance LPX as **DDR4**; LA-0012 and LA-0013 identify both as **DDR3**.

## File location note

Accessioned into `SCADUMEN/FORGOTTEN-INDUSTRIES` on 2026-08-27 on branch `claude/handoff-archive-accession-hbfffa`, at `intake/larchive-accession-log.md` and `intake/CLAUDE.md`. Both paths are tracked — the `.gitignore` rules under `intake/` cover raw media and specific payload folders, not these two files.

Earlier history: originally maintained at `/mnt/user-data/outputs/larchive-accession-log.md` in a claude.ai session, then carried in a local working copy on branch `larchive-accession-log` (branched from `eBay`), which also held uncommitted work under `src/assets/archive/objects/` and edits to `src/data/inventory.yml`/`projects.yml`. That work is not present here; this repository's `main` already carries the corresponding `FI-` records.

Keep this file's "Open items" list in sync as entries get closed out.
