---
title: ATLAS Field Dossier 2026.07.03 — Unmanned Systems Storage Media
id: FI-LOG-011
slug: unmanned-systems-storage-media
date: 2026-07-03
timestamp: 2026-07-03 CT
category: atlas-report
object: Perry / PEREGRINE aircraft media cards
system: Consumer UAS / DJI Mini-class aircraft / DJI RC storage workflow
status: published field guidance from intake draft
associated_project: FI-PROJ-004
signature: "ATLAS // Field Dossier // 2026.07.03"
---

# DOSSIER // UNMANNED SYSTEMS STORAGE MEDIA

## Quick Start Guide for Aircraft + Ground Controller microSD Use

**Classification:** FI-FIELD-NOTE  
**System:** Consumer UAS / DJI Mini-class aircraft  
**Operator Case:** PERRY  
**Status:** Draft v1.0, normalized for publication  
**Generated:** 2026-07-03 America/Chicago  
**Provenance:** ATLAS-generated from an operator conversation; human-directed, machine-synthesized.

> **Rule:** The aircraft card is the evidence. The controller card is the convenience.

A drone with two microSD slots is not asking for two equal storage devices. It is splitting the mission record between the airframe and the ground station.

The aircraft microSD card is the primary archive. This is where the clean camera files are written: full-resolution photographs, RAW files when available, and full-bitrate video. In the DJI Mini 3, internal storage is not supported, and video can be recorded at up to 100 Mbps in MP4/H.264, so the aircraft card is mission-critical.

The DJI RC microSD card is secondary. It supports the controller's local storage tasks: cached media, previews, exports, screenshots, and screen recordings. The controller card can be useful, but it is not the primary flight record.

## Prime Directive

If only one card is available, put it in the aircraft.

A controller without a card is inconvenient. An aircraft without a card is undocumented.

## Why Card Class Matters

Video is a continuous write operation. The camera must keep feeding data to the card without interruption. If the card cannot sustain the write rate, the result can be stopped recording, dropped frames, corrupted files, or card-speed warnings.

The symbols that matter are:

- **microSDXC** — modern high-capacity card type.
- **U3** — UHS speed class with 30 MB/s minimum sustained write speed.
- **V30** — video speed class with 30 MB/s minimum sustained write speed.

For Perry-class DJI use, U3 / V30 is the field minimum.

## The Math

Perry's max bitrate: 100 Mbps.

Divide by 8: 12.5 MB/s.

A real V30 card sustains 30 MB/s, which gives more than double the required write-rate headroom. That headroom matters because cards can slow down with heat, age, poor controller hardware, bad batches, and nearly-full capacity.

Higher classes like V60 or V90 do not make the image prettier. They do not increase resolution, dynamic range, sharpness, or color. They mainly provide more sustained write headroom and faster offloads, which matters more for high-end cameras than for a Mini-class aircraft.

## Capacity Guidance

64 GB is the field minimum for a short mission day.

128 GB is the practical low-cost answer. It gives breathing room without wasting money.

256 GB is useful for travel, mapping sessions, or delayed offload days, but it is not mandatory for the basic PERRY flight record.

At 100 Mbps, worst-case recording consumes roughly 45 GB per hour. Real-world use may be lower, but the math explains why 32 GB feels cramped and 64 GB is only acceptable as the low end.

## Used Cards

Used microSD cards are acceptable only when the source is trusted.

The danger is not that a used card is simply slow. The danger is that it is fake, worn, heat-cycled, partially corrupted, or silently unreliable. A used card that fails during a flight does not fail politely. It loses the record.

For aircraft use, buy new when possible. For controller use, used or spare cards are acceptable.

## Field Purchase Rule

Buy the cheapest reputable card that clearly says:

**microSDXC // U3 // V30**

Good budget target:

**64 GB or 128 GB U3/V30 microSDXC**

Avoid cards that only say:

- Class 10
- U1
- A1 only
- "4K" marketing without V30
- Mystery marketplace brands

## Deployment Procedure

1. Install the best card in the aircraft.
2. Format it inside the DJI system before first use.
3. Confirm remaining record time before takeoff.
4. Use the controller card later for screenshots, screen recording, cache, and export convenience.
5. After flight, offload the aircraft card first.

The aircraft card is the negative. The controller card is the receipt.

## Operator Summary

For Perry:

- **One card only:** aircraft slot.
- **Minimum:** 64 GB U3/V30.
- **Recommended cheap:** 128 GB U3/V30.
- **Controller card:** optional later.
- **Higher class:** reliability and transfer speed, not better footage.
- **Used:** acceptable for controller, risky for aircraft.

## Source Notes

- DJI Mini 3 specifications: https://www.dji.com/mini-3/specs
- DJI RC user manual: https://dl.djicdn.com/downloads/DJI_RC/UM/20220630/DJI_RC_User_Manual_v1.0_en.pdf
- Kingston memory card speed class explainer: https://www.kingston.com/en/blog/personal-storage/memory-card-speed-classes

## ATLAS Provenance Plate

```text
FORGOTTEN INDUSTRIES // FIELD DOSSIER
UNMANNED SYSTEMS STORAGE MEDIA

HUMAN JUDGMENT // MACHINE COLLABORATION
OPERATOR EXPERIENCE // ATLAS SYNTHESIS
PERRY // MICROSD // AIRCRAFT RECORD

Generated by ATLAS from a live operator exchange.
This document is not a detached machine artifact.
It is a product of interaction: question, clarification, correction, synthesis.

A thing documented is a thing not yet lost.
```
