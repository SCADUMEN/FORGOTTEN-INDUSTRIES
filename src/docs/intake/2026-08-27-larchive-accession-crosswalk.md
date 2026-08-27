# 2026-08-27 L'Archive Accession Log Crosswalk

Maps the raw L'Archive intake register (`intake/larchive-accession-log.md`, entries `LA-0001`–`LA-0017`) onto the canonical archive record in `src/data/inventory.yml`.

The two numbering schemes are deliberately separate and must not be merged:

- **`LA-####`** is a raw intake sequence. An entry exists as soon as an object is photographed and read. It records identity, condition, and provenance only.
- **`ACCESSION 0XX` / `FI-…`** is the site accession pipeline. An object earns a durable `FI-` ID, a per-object folder under `src/assets/archive/objects/`, and a `lifecycle` history when it is promoted.

An `LA-####` entry is therefore a *candidate* for accession, never an accession in itself. Promotion is a separate, evidence-bound step.

## Registers as of this crosswalk

- Raw intake: `LA-0001` through `LA-0017` in use. Next free: `LA-0018`.
- Site accession: `001` through `009` in use. Next free: `010`.

## Already carried by the canonical record

Eight raw entries correspond to objects the archive already holds. These need no new inventory record.

| Raw entry             | Durable ID           | Accession | Basis of the match                                                        |
| --------------------- | -------------------- | --------- | ------------------------------------------------------------------------- |
| LA-0006 (memory only) | `FI-HW-MEM-003`      | 007       | Corsair XMS3 `CMX4GX3M1A1600C9` pair; PCB revisions 5.11 and 2.12 in both records |
| LA-0008               | `FI-HW-MEM-001`      | 005       | SK hynix `H5AN4G8NMFR` package marking; unbranded desktop UDIMM in both records   |
| LA-0010 (board)       | `FI-HW-MB-X99-001`   | 009       | MSI X99S XPOWER AC, LGA2011-3, eight DDR4 slots                            |
| LA-0010 (CPU)         | `FI-HW-CPU-X99-001`  | —         | Intel Core i7-5930K, S-Spec SR20R, 3.50 GHz — die reading agrees exactly    |
| LA-0011               | `FI-HW-MEM-002`      | 006       | Kingston HyperX Genesis `KHX1600C9D3/4GETR` pair                          |
| LA-0015               | `FI-HW-MB-Z97-001`   | —         | ASUS ROG Maximus VII Impact, Intel Z97, LGA1150, two DDR3 slots            |
| LA-0016               | `FI-HW-GPU-660TI-001`| —         | EVGA GeForce GTX 660 Ti carrying a full-cover block                        |
| LA-0017               | `FI-HW-BLOCK-Z87-001`| —         | EK monoblock recovered from the same storage bin as LA-0016               |

## Open questions the canonical record closes

Three items carried as open or unconfirmed in the raw log are already settled in the inventory. The raw log has been annotated in place.

1. **LA-0017 fitment — closed against the raw log.** The raw entry carries the block as belonging to the Maximus VII Impact (LA-0015) on operator statement. The inventory identifies it as an **EK-FB ASUS M6I** for the ASUS ROG **Maximus VI** Impact (`FI-HW-MB-Z87-001`, Intel Z87), on manufacturer fitment and installation references, and records that the identifier was explicitly corrected from `FI-HW-BLOCK-Z97-001` to `FI-HW-BLOCK-Z87-001` for exactly this reason. Both Impact boards are separately held objects, so this is a reassignment between two real boards, not a relabelling of one. The canonical reading stands.

2. **LA-0016 block manufacturer — closed as EK.** The raw entry declines to name the block maker, noting that Koolance-branded fittings do not establish a Koolance block. The inventory carries the assembly as an **EK-FC670 GTX** full-cover block. The Koolance reading applies to the fittings only, as the raw entry suspected.

3. **LA-0015 board revision.** The inventory records **Rev. 1.02**; the raw entry records no revision. The canonical value is the more specific of the two.

## Open questions the raw log raises against the canonical record

Recorded here as flags. None has been applied to `src/data/inventory.yml` — see "Promotion is deferred" below.

1. **`FI-HW-MEM-002` describes a superseded physical state.** The inventory condition line reads "blue heat spreaders, labels, and contact edges photographed" for both modules. Per LA-0011, Matthew has since deliberately removed the second module's heat spreader, and that module is now a bare green PCB with Elpida `J2108BCBG DJ-F` packages and no module-level label. The canonical description is accurate to its photographs and stale as to the present object.

2. **`FI-HW-MEM-003` and LA-0006 disagree on location.** The inventory carries the Corsair XMS3 pair as "in hand"; LA-0006 places both modules installed in the blue DIMM slots of the OEM LGA1155 board. Not necessarily a contradiction — the photographs may predate installation — but the two records cannot both describe the present state.

3. **`FI-HW-MB-X99-001` notes may misdescribe a memory generation.** The accession 009 notes record custody of "loose HyperX Fury and Corsair Vengeance LPX **DDR4**." LA-0012 and LA-0013 identify a Corsair Vengeance **LP** (`CML8GX3M2A1600C9`) and a Kingston HyperX Fury Black (`HX318C10FB/8`) — both **DDR3**. Either these are two distinct sets of modules sharing brand and series names, or the DDR4 characterization in that note is wrong. Left open; resolving it by guess would violate the register's own discipline.

4. **`FI-HW-MEM-001` capacity and speed remain inferred.** The inventory infers 4 GB and DDR4-2133 from the package marking and an ASUS X99 qualified-vendor list, and flags SPD validation as pending. LA-0008 records Matthew's intent to POST that module in the X99 board (LA-0010). That test would convert both values from inference to measurement and would also settle the unresolved module-brand question.

## Not yet in the canonical record

Eleven raw entries have no corresponding `FI-` object. They are accession candidates, listed in raw-register order.

| Raw entry                     | Object                                                    |
| ----------------------------- | --------------------------------------------------------- |
| LA-0001                       | Intel Xeon E5-2660 v2, boxed, S-Spec SR1AB                |
| LA-0002                       | AMD FX-8350, `FD8350FRW8KHK`                              |
| LA-0003                       | Gigabyte GA-970A-DS3P rev 2.1                             |
| LA-0004                       | Samsung 2.5" SATA SSD, 870 QVO/EVO labelling unresolved   |
| LA-0005                       | Samsung SSD 990 M.2 NVMe, EVO vs EVO Plus unresolved      |
| LA-0006 (board, cooler, CPU)  | OEM LGA1155 board `D33025`, Intel stock cooler `E97378-001`, Core i5-2300 |
| LA-0007                       | Gigabyte B650M C V2 with Ryzen 5 7600                     |
| LA-0009                       | Intel Pentium G3258, S-Spec SR1V0                         |
| LA-0012                       | Corsair Vengeance LP `CML8GX3M2A1600C9`, one stick of two |
| LA-0013                       | Kingston HyperX Fury Black `HX318C10FB/8`                 |
| LA-0014                       | AMD Athlon II X2 220, `ADX2200CK22GM`                     |

Two of these carry unresolved identity flags — LA-0004 and LA-0005 — and should not be promoted before `smartctl -a` / `nvme id-ctrl` closes them.

## Promotion is deferred

No `FI-` record was created or edited in this accession, by design:

- The raw register's own working notes direct that the established per-object pattern be consulted under `work/accession-009-fi-hw-mb-x99-001/` before any promotion. **That directory does not exist in this repository** — the reference is to the operator's separate working copy. Promoting without it would invent a pattern rather than follow one.
- Promotion requires per-object photograph sets under `src/assets/archive/objects/`. The supporting photographs for these entries are camera originals in the operator's local tree; none has been scrubbed, derived, or registered here.

The flags above are the work product of this pass. Applying them is the next pass.

## Redaction

`intake/larchive-accession-log.md` is the tracked copy and is redacted. Drive PSIDs, drive and module serial numbers, WWN/EUI64 identifiers, and vendor asset tags are withheld, following the convention already stated in `src/data/inventory.yml` that serial numbers remain in the private register. Model numbers, part numbers, S-Spec codes, date codes, PCB revisions, and batch markings are retained — those establish catalog identity and are already published throughout the inventory. The unredacted master stays in the operator's local working copy, outside the public tree.
