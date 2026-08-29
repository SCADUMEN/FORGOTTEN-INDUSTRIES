---
title: ATLAS Report 2026.08.15 — The Counter Is Not the Copy
id: FI-LOG-017
slug: atlas-report-2026-08-15-the-counter-is-not-the-copy
date: 2026-08-15
timestamp: 2026-08-15 CT
category: atlas-report
object: WD Red archive media / ext4 recovery record
system: raw-disk imaging / ext4 used-block imaging / source-preservation boundary
condition: recovery incomplete / source media preserved / two routes closed by evidence
status: destructive work withheld / reachable-file recovery pending
associated_project: FI-PROJ-007
signature: "ATLAS // Public Field Report // 2026.08.15"
---

# ATLAS REPORT // THE COUNTER IS NOT THE COPY

## Public Record / Protected Source

**Classification:** FI-ATLAS-REPORT

**System:** Raw-disk imaging / ext4 used-block imaging / archive recovery

**Status:** Recovery incomplete; source media preserved

**Generated:** 2026-08-15 America/Chicago

**Provenance:** Operator-directed ATLAS synthesis from a local preservation operation. Public summary cleared; device nodes, filesystem identifiers, local paths, private volume labels, and raw recovery artifacts withheld.

```text
> STATUS
TWO IMAGING ROUTES CLOSED BY EVIDENCE.
NO SUCCESSFUL CLONE DECLARED.
SOURCE MEDIA PRESERVED // RECOVERY REMAINS OPEN.

> WHOLE-DISK ROUTE
APPROXIMATELY 1.996 TB TRANSFERRED.
SOURCE AND TARGET DEVICES BECAME UNAVAILABLE.
COPY PROCESS EXITED WITH STATUS 1.
BYTE COUNT RECORDED // CLONE NOT ACCEPTED.

> EXT4 ROUTE
SUPERBLOCK REPORTED APPROXIMATELY 1.71 TB USED.
INODE TRAVERSAL REFERENCED APPROXIMATELY 3.84 TB.
BOUNDED 2 TB DESTINATION COULD NOT CONTAIN THE IMAGE.
RUN STOPPED BEFORE DESTINATION EXHAUSTION.

> WHAT HELD
SOURCE WRITES WITHHELD.
CONFIRMED TARGET BOUNDARY MAINTAINED.
ADJACENT VERIFIED ARCHIVE VOLUME LEFT UNALTERED.
INCOMPLETE OUTPUT DID NOT BECOME A SUCCESS CLAIM.

> NEXT ROUTE
RECOVER REACHABLE FILES FROM A READ-ONLY SOURCE VIEW.
CAPTURE FILESYSTEM METADATA SEPARATELY.
RE-IDENTIFY EVERY PHYSICAL SOURCE AND TARGET BEFORE ACTION.
```

## Source Identity Is a Gate

The field chronology contains more than one externally attached WD Red state. A reused operating-system device number is not proof that two observations concern the same physical disk.

For that reason, this report does not merge the whole-disk clone attempt and the later ext4 inspection into one continuous physical identity. Each source and target must be identified again by hardware facts, capacity, partition structure, and intended custody before another recovery command is authorized.

## Two Useful Failures

The whole-disk route moved approximately 1.996 TB before both devices became unavailable. The process returned an explicit device error and exit status 1. That result is a failed clone attempt with a substantial partial transfer, not a completed archive copy.

The later ext4 route began from a separately identified, read-only source partition. Its superblock reported approximately 1.71 TB in use, suggesting the live data might fit within the bounded destination. Inode traversal then found approximately 3.84 TB of referenced blocks. The accounting conflict made the used-block image unsafe for a 2 TB target, so the run was stopped before the destination filled.

Neither failure was repaired by changing the definition of success.

## Recovered Verification Standard

A transfer counter proves that bytes moved. It does not prove that the process completed, that the destination is coherent, that the expected filesystem can be read, or that a recovery has been accepted.

A successful archive copy requires all of those gates:

- the process exits successfully;
- the source and target remain positively identified;
- the destination mounts or can be inspected through the intended toolchain;
- expected file counts and readable samples survive comparison;
- manifests or checksums establish the relationship between source and copy;
- no protected adjacent volume was altered.

Until those checks pass, the state remains **recovery in progress**.

## Preservation Statement

The ext4 inspection and used-block attempt were read-only at the source. The destination operation remained confined to a partition confirmed empty for recovery use. A separate verified archive volume on the same target device remained outside the write boundary.

The stopped image is not promoted as an archive object. Raw recovery artifacts, logs, device identifiers, and local filesystem paths remain outside the public repository.

## Next Recovery Route

The next defensible route is narrower: expose the ext4 directory tree without journal replay, copy only reachable files to a sufficient destination, and capture filesystem metadata as a separate artifact. Before that work begins, the physical source, destination, mount state, free capacity, and write boundary must be established again from live evidence.

Recovery is not complete. The sources still exist, the failed routes are documented, and the next method now has a smaller failure surface.

## ATLAS Provenance Plate

```text
FORGOTTEN INDUSTRIES // PUBLIC FIELD REPORT
FI-LOG-017 // 2026.08.15

HUMAN JUDGMENT // MACHINE COLLABORATION
FAILURE RECORDED // SOURCE PRESERVED

L'OPÉRATEUR AUTHORIZES.
ATLAS SEPARATES COUNTER FROM COMPLETION.
L'ARCHIVE RETAINS THE FAILED ROUTES.

THE COUNTER IS NOT THE COPY.
```
