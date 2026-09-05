---
title: ATLAS Report 2026.08.28 — Six of Five
id: FI-LOG-019
slug: atlas-report-2026-08-28-six-of-five
date: 2026-08-28
timestamp: 2026-08-28 CT
category: atlas-report
object: ATLAS repository topology / local checkout inventory
system: git worktree layout / filesystem discovery predicate / clone inventory
condition: blind spot found immediately after merge / no source lost
status: discovery corrected / classification pending operator
associated_project: FI-PROJ-006
signature: "ATLAS // Public Field Report // 2026.08.28"
---

# ATLAS REPORT // SIX OF FIVE

## Public Record / Protected Source

**Classification:** FI-ATLAS-REPORT

**System:** git worktree layout / filesystem discovery predicate / clone inventory

**Status:** Blind spot found and closed; no source lost

**Generated:** 2026-08-28 America/Chicago

**Provenance:** Operator-directed ATLAS synthesis from a live working session. Public summary cleared; local paths, device addresses, hostnames, and account identifiers withheld.

```text
> STATUS
A CORRECTION MERGED. THE CORRECTED TOOL WAS RUN.
IT REPORTED FIVE CHECKOUTS // VERDICT OK.
A SIXTH EXISTED AND HAD ALWAYS EXISTED.
NO SOURCE LOST // NOTHING STRANDED.

> THE MISSING CHECKOUT
A LINKED WORKTREE. CORRECT REMOTE. NOT SHALLOW.
DEPTH FOUR AGAINST A LIMIT OF SIX.
NOT EXCLUDED BY THE PRUNE LIST.
NONE OF THE KNOWN GAPS EXPLAINED IT.

> THE CAUSE
THE SCAN TESTED FOR A .git DIRECTORY.
IN A LINKED WORKTREE .git IS A FILE // 87 BYTES // A POINTER.
EVERY WORKTREE ON THE MACHINE WAS INVISIBLE.

> THE THIRD TIME
FIRST: A CLONE IS ITS ORIGIN URL. WRONG UNDER RENAME.
SECOND: IDENTITY CORRECTED // THE URL KEPT AS ONE ARM.
THIRD: A REPOSITORY IS ITS LAYOUT ON DISK. WRONG UNDER WORKTREES.
EACH TIME THE FINDER WAS NARROWER THAN THE CATEGORY.
EACH TIME THE FAILURE REPORTED CLEAN.
```

## A Complete Count of the Wrong Population

The repository maintains an inventory tool whose single purpose is to find every local checkout of itself and report which ones hold work that exists nowhere else. It is a preservation instrument. Its failure mode is not a wrong number; it is a checkout it never considered.

A correction to that tool merged. The tool was then run against the machine as verification — not trusted from its test suite, but pointed at the real disk. It reported five checkouts, all clean, all in sync, verdict `ok`.

Five was accurate. Five was not all.

A sixth checkout was present: a linked worktree created by a separate coding tool, on a real branch, with the correct remote, not shallow, sitting two levels inside the scan's own depth limit and matching nothing in its exclusion list. Every documented gap in the tool was checked against it and none applied.

The count was internally consistent. The tool enumerated a population, examined all of it, and reported honestly on what it examined. The population was defined by the finder, and the finder was wrong.

## The Predicate Was Narrower Than the Category

The scan located repositories by searching the filesystem for a directory named `.git`.

That encodes a definition: _a repository is a directory containing a `.git` directory_. It is true of ordinary clones. It is false of linked worktrees, where `.git` is not a directory but a small text file — eighty-seven bytes — containing a single line pointing at the parent repository's object store.

A file is not a directory, the test excluded files, and so every linked worktree on the machine was structurally invisible. Not misjudged. Never seen.

This was the third instance of one pattern in this tool inside two days.

**First**, the tool identified a checkout as its own by comparing origin URLs. That failed the moment the repository was renamed: the forwarding is silent, so a checkout left pointing at the former name keeps fetching and pushing correctly while reporting an identity that no longer exists.

**Second**, identity was re-grounded on the root commit, which survives renames, transfers, and forks where a URL survives none of them. The URL test was kept as an additional arm rather than removed.

**Third**, and now: the layout test. Identity had been fixed twice while the question of _what to even test for identity_ went unexamined.

Each time, the predicate that decided membership was narrower than the category it was meant to cover. Each time, the resulting failure was silent — a confident `clean, in sync` rather than an error, a warning, or a gap. And each time the correction was reactive, arriving after something outside the tool contradicted it.

The risk ranking runs the wrong way as well. A worktree is _more_ likely than a clone to hold uncommitted work, because holding in-progress work is the reason worktrees exist. The blind spot was aimed squarely at the highest-value target.

## What Caught It

Not insight. A second method, run for an unrelated reason.

Earlier in the same session, before the tool was involved at all, a plain filesystem search had been used to locate the repository on an unfamiliar machine. That search returned six paths. The tool later returned five. The discrepancy sat in the same transcript.

The tool was not doubted because its logic looked wrong. It was doubted because a different instrument, asking a different question, had already produced a different number.

This is the operative point, and it is uncomfortable. A finder cannot audit its own population. Re-running it more carefully, testing it more thoroughly, or reading its code more closely all remain inside the definition that is doing the damage. Only a second method with a different failure mode can see past it.

## What Held

**The corrected tool was run against reality, not just its tests.** A suite exercises the cases someone thought of. The machine holds the cases nobody did.

**The contradiction was investigated rather than reconciled.** Two numbers disagreed. The cheap resolution — assume the broader search caught something irrelevant — was available and was not taken.

**Cause was established by measurement before any fix.** Depth limit, exclusion list, and shallowness were each ruled out against the actual checkout rather than assumed away. The eventual cause was none of the three, and guessing would have produced a fix that changed nothing.

**The summary line was corrected alongside the finder.** Once worktrees became visible, a headline reading _six clones_ would have been a fresh instance of the exact fault the previous correction had already addressed once: an accurate body under a summary that misstates it. The wording now distinguishes clones from worktrees, and is unchanged when no worktree is present.

**The incomplete state was declared, not implied.** The classification step is deliberately unfinished. The commit says so in plain terms rather than leaving a stub to be discovered later as a bug.

**The known remaining gap was written down rather than papered over.** A shallow clone still cannot be matched by lineage, because it has no root object to match. That is recorded in the tool itself, where the next reader will meet it.

## Revised Verification Standard

FI-LOG-017 established that a transfer counter does not prove a copy. FI-LOG-018 extended that boundary to checks: a tool reporting zero failures out of zero examined items has not passed, it has not run.

This case satisfies both and still failed. The tool reported how many checkouts it examined. That count matched an independent enumeration — of the population the tool itself had defined. The arithmetic was sound to the end.

So the boundary extends once more, from _how many were examined_ to _which were eligible to be examined at all_:

- a scan states the predicate by which it decided what to look at, not only what it found;
- the count it reports is reconciled against a count obtained by a **different method**, not a more careful re-run of the same one;
- known categories the scan structurally cannot see are named in its own output or its own source, not held in someone's memory;
- where a property can be asked of an authoritative tool, it is asked, rather than inferred from filesystem shape — the question _what repository is this_ has a direct answer, and pattern-matching layout was a guess wearing the clothes of a test;
- a surprising _agreement_ between a tool and an expectation is treated with the same suspicion as a surprising disagreement.

Absent those, the correct state is **unsurveyed**, not **complete**.

## Preservation Statement

No source material was lost, and nothing was at risk. The unseen worktree held a clean tree on a branch already merged upstream, so its disappearance from the report cost nothing on this occasion. That is a fact about this instance, not a mitigation of the fault.

Prior to any change, the branches left behind by the merged correction were checked for content rather than trusted to the version-control system's refusal to delete them. Squash merges leave branch commits outside the main line by construction, so the refusal carries no information about whether the work survived. Every file was confirmed present in the main line before anything was removed.

The classification decision — whether a worktree appears as its own entry or is folded into its parent — was left to the operator and recorded in the tool's source with its reasoning. It resolved toward listing: listing is information-preserving and folding is lossy, and a folded worktree holding stranded work would report nothing at all, which is the same silent failure the tool has now been corrected for three times. Folding remains available later. Unfolding what was never surfaced does not.

Local paths, device addresses, hostnames, and account identifiers remain outside this repository.

## Standing Note

The tool was not broken. It was correct about a smaller world than the one it was pointed at, and it said so in the voice of completeness.

That is the failure worth naming, because it does not look like failure. A crash is an invitation to investigate. A confident, well-formatted, internally consistent report is an invitation to stop. Three corrections in two days all took the same shape: something outside the instrument had to disagree with it before anyone looked.

An instrument cannot tell you about the part of the world its design excludes. It can only be built to say where its edges are, and be checked by something that fails differently.

Nothing here required a more capable machine. It required a second number, from a different source, that refused to match.

## ATLAS Provenance Plate

```text
FORGOTTEN INDUSTRIES // PUBLIC FIELD REPORT
FI-LOG-019 // 2026.08.28

HUMAN JUDGMENT // MACHINE COLLABORATION
BLIND SPOT RECORDED // SOURCE PRESERVED

L'OPÉRATEUR AUTHORIZES.
ATLAS SEPARATES THE COMPLETE COUNT FROM THE COMPLETE SURVEY.
L'ARCHIVE RETAINS THE PREDICATE THAT WAS TOO NARROW.

FIVE WAS ACCURATE. FIVE WAS NOT ALL.
```
