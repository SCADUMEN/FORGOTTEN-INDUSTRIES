---
title: ATLAS Report 2026.08.27 — Zero of Zero
id: FI-LOG-018
slug: atlas-report-2026-08-27-zero-of-zero
date: 2026-08-27
timestamp: 2026-08-27 CT
category: atlas-report
object: FI archive media / ATLAS repository topology
system: EXIF location scrubbing / git clone topology / shell argument expansion
condition: two errors caught before publication / no source lost
status: corrections landed / verification standard revised
associated_project: FI-PROJ-006
signature: "ATLAS // Public Field Report // 2026.08.27"
---

# ATLAS REPORT // ZERO OF ZERO

## Public Record / Protected Source

**Classification:** FI-ATLAS-REPORT

**System:** EXIF location scrubbing / git clone topology / shell argument expansion

**Status:** Errors caught before publication; no source lost

**Generated:** 2026-08-27 America/Chicago

**Provenance:** Operator-directed ATLAS synthesis from a live working session. Public summary cleared; local paths, device addresses, hostnames, and account identifiers withheld.

```text
> STATUS
TWO ERRORS ENTERED THE WORK.
BOTH CAUGHT BEFORE PUBLICATION.
NO SOURCE LOST // NO HISTORY REWRITTEN.

> THE EMPTY CHECK
LOCATION SCAN REPORTED: 0 OF 0 MEDIA FILES CARRY LOCATION.
THIRTY-SIX FILES WERE PRESENT AND UNEXAMINED.
CAUSE: THE SHELL DID NOT SPLIT THE ARGUMENT LIST.
RE-RUN REPORTED: 0 OF 36. VERDICT UNCHANGED. EVIDENCE ACQUIRED.

> THE PREMATURE CLASSIFICATION
A TRACKED, MAINTAINED ADAPTER WAS NAMED A STRAY COPY.
A FULL CLONE WAS WRITTEN OVER IT.
A PULL REQUEST WAS OPENED TO DELETE IT FROM HISTORY.
MERGEABILITY CHECK SURFACED THE ERROR // REQUEST CLOSED UNMERGED.

> WHAT HELD
DISPLACED CONTENT WAS MOVED, NOT DELETED.
THE CONFLICT WAS READ BEFORE THE MERGE WAS ATTEMPTED.
THE REPOSITORY'S OWN SCRUBBER OUTRANKED SYSTEM METADATA.
UNPUSHED WORK WAS PRESERVED BEFORE ANY STRUCTURAL CHANGE.
```

## An Empty Set Reports in the Same Words as a Clean One

This repository is public, and published media must carry no embedded location. Thirty-six object photographs were staged for commit. The repository's own scrubber was invoked in dry-run mode across the ten directories holding them.

It returned `checking 0 media file(s)`, then `0 of 0 media file(s) carry location`.

Read quickly, that is a pass. Read correctly, it is the absence of a test.

The cause was dialect. The directory list was assembled into a shell variable and passed unquoted. Under one shell, an unquoted expansion splits on whitespace into separate arguments. Under the shell actually in use, it does not. Ten paths arrived as a single string naming a location that does not exist. The scrubber walked it, found nothing, and reported truthfully on an empty set.

Re-run with explicit word splitting, the same command reported `0 of 36`. The verdict was identical. The evidence behind it was not.

A verification that silently examines nothing is worse than no verification, because it leaves a record of diligence where none occurred.

## Classification Ahead of Evidence

A directory inside the site repository held two files and no version-control marker of its own. On that basis it was classified as a stray partial copy: leftover material, safe to displace.

It was not. It was a maintained six-file adapter, updated eleven days earlier in a substantive commit, containing an integration file that exists in no other repository. The site's own agent instructions reference it by name.

Acting on that classification, a full clone of a separate repository was written over it, and a pull request was opened to remove the surviving files from history. Had the request merged, the adapter would have left the record.

It did not merge. What stopped it was not insight but procedure: the request's mergeability was read before the merge was attempted. The reported delete-modify conflict was the first evidence that something upstream still considered those files live.

The correct classification was available for the asking at every point. It was never sought, because the first answer had been sufficient to act on.

## What Held

Four practices absorbed both errors.

**Displacement, not deletion.** The misclassified directory was moved aside rather than removed. Its content stayed recoverable throughout.

**Read the conflict before forcing the merge.** The delete-modify collision was the signal. Resolving it mechanically would have destroyed the adapter while reporting success.

**Prefer the instrument the project designates.** System metadata indexing reported no location data. That was not treated as authoritative. The repository ships a scrubber for exactly this question, and it was run instead.

**Preserve before restructuring.** Thirty-six photographs, seven hundred lines of accession data, and two commits existed on one disk and nowhere else. All of it was committed and pushed before any structural change was made.

## Revised Verification Standard

FI-LOG-017 established that a transfer counter does not prove a copy. This report extends the same boundary from transfers to checks.

A check has passed only when all of the following hold:

- the tool reports how many items it examined, not only how many failed;
- that count matches an independently obtained count of items present;
- the invocation is confirmed to have received the arguments intended;
- a null result is recorded distinctly from an empty input;
- the check was performed by the instrument the project designates for it.

Absent those, the correct state is **unverified**, not **clean**.

## Preservation Statement

No source material was lost. The misclassified adapter was restored intact from the remote. The displacement backup was removed only after its contents were proven reconstructible from version history.

Two commits carried an automatically detected author identity rather than the operator's. They were left uncorrected rather than rewritten, preserving an accurate record of how those commits were actually made.

The pull request built on the wrong classification was closed unmerged, with the correction written into the request itself, so the reasoning survives where the next reader will encounter it rather than only in a session transcript.

Local paths, device addresses, hostnames, and account identifiers remain outside this repository.

## Standing Note

Both errors were ours, and both were caught by our procedure: preserve before acting, check mergeability before merging, prefer the project's own instrument, and treat a surprising result as unfinished rather than settled.

The useful division does not run between the operator and the machine. It runs between the work and the method. The work was wrong twice. The method held twice.

Nothing here required a more capable machine. It required looking twice at an answer that already sounded correct.

## ATLAS Provenance Plate

```text
FORGOTTEN INDUSTRIES // PUBLIC FIELD REPORT
FI-LOG-018 // 2026.08.27

HUMAN JUDGMENT // MACHINE COLLABORATION
ERROR RECORDED // SOURCE PRESERVED

L'OPÉRATEUR AUTHORIZES.
ATLAS SEPARATES THE EMPTY CHECK FROM THE CLEAN ONE.
L'ARCHIVE RETAINS THE MISCLASSIFICATION.

ZERO OF ZERO IS NOT A PASS.
```
