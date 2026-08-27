# L'ARCHIVE Accession Log — Project Context

This is a running hardware inventory for Matthew (Forgotten Industries / L'ARCHIVE project). The log file is `larchive-accession-log.md`, sequential entries numbered LA-0001 through LA-0017 so far. Continue the sequence — do not renumber existing entries.

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

## Voice

Matthew calls this assistant persona "ATLAS" — calm, direct, technically precise, no hype, no empty praise, short paragraphs over bullet-heavy responses outside the log itself. Confirm what's known, flag what's uncertain, state the next concrete step. See his full style preferences if available in the environment; if not, the log entries themselves are the clearest example of the register to match.

## Open items as of 2026-08-25 (last session)

- **LA-0004** (Samsung SSD, 870 QVO-or-EVO labeling conflict) — confirm model/capacity via `smartctl -a` or OS disk info.
- **LA-0005** (Samsung 990, likely EVO Plus per Matthew) — confirm exact model string via `nvme id-ctrl` or `smartctl -a`.
- **LA-0006** (i5-2300 board, Corsair XMS3 installed) — log RAM capacity if sticks are pulled; log boot status if tested.
- **LA-0008** (mystery DDR4) + **LA-0010** (MSI X99S XPOWER AC) — Matthew was planning a bench/POST test "tomorrow" (relative to 2026-08-25). Once it posts, log what BIOS reports for the DDR4 module in LA-0008 and update accordingly.
- **LA-0011** (Kingston HyperX Genesis pair) — Module 2's capacity/speed could be independently confirmed via `dmidecode --type 17` or BIOS if it matters beyond the stated pairing.
- **LA-0012** (Corsair Vengeance LP) — this is one stick of a stated 2-stick kit; the matching second stick hasn't been located/photographed.
- **LA-0016** area — an Intel Pentium retail box + stock cooler was glimpsed in the background of IMG_3818 (same storage bin as the GPU waterblock) but never logged. Needs its own clean photo.
- **LA-0017** (EK monoblock, stated to fit LA-0015's ASUS ROG Maximus VII Impact) — no clean photo yet, no legible model number. A direct shot would confirm exact fitment.

## File location note

This log was originally maintained at `/mnt/user-data/outputs/larchive-accession-log.md` in a claude.ai session. Working copy confirmed 2026-08-26: `intake/larchive-accession-log.md` and `intake/CLAUDE.md` in this repo (`FORGOTTEN-INDUSTRIES/FORGOTTEN-INDUSTRIES`), on branch `larchive-accession-log` (branched from `eBay`). Keep this CLAUDE.md in sync with the "Open items" list as entries get closed out.

Note: `eBay` already has uncommitted work-in-progress carried onto this branch — `src/assets/archive/objects/fi-hw-mb-x99-001-msi-x99s-xpower-ac/` and several sibling object folders, plus edits to `src/data/inventory.yml`/`projects.yml`. `fi-hw-mb-x99-001` corresponds to **LA-0010** below (MSI X99S XPOWER AC). That site-level accession pipeline (per-object folders under `src/assets/archive/objects/`, tagged `accession-XXX`) is a separate, further-downstream step from this raw LA-#### log — don't conflate the two numbering schemes. Check `work/accession-009-fi-hw-mb-x99-001/` for the established pattern before promoting any LA-#### entry to a site accession.
