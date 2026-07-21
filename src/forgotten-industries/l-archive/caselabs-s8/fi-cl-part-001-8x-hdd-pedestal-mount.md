---
title: "8× Vibration-Isolated 3.5-inch HDD Pedestal Mount"
date: 2026-06-20
category: l-archive-entry
system: "Forgotten Industries"
collection: "CaseLabs Mercury S8 / pedestal"
object_id: "FI-CL-PART-001"
object_type: "HDD tray / drive mount assembly"
status: "intake"
source_intake: "src/forgotten-industries/intake/l-archive/2026-06-20-caselabs-chassis-parts.md"
photo_refs: ["PHOTO-001", "PHOTO-002", "PHOTO-003", "PHOTO-004", "PHOTO-005"]
representative_photo: "assets/representative-photos/fi-cl-part-001.jpg"
confidence: "medium"
signature: "Forgotten Industries // L’Archive // 2026.06.20"
---

## Object ID

`FI-CL-PART-001`

## Summary

This object appears to be a CaseLabs pedestal storage plate with capacity for eight vibration-isolated 3.5-inch mechanical hard drives. It is provisionally assigned to the pedestal side-drive or storage-bay assembly and matters to the current build as the planned high-capacity storage mount. The exact official CaseLabs name needs verification.

## Photographic Record

- PHOTO-001–PHOTO-005

![FI-CL-PART-001: 8× HDD pedestal mount](../assets/representative-photos/fi-cl-part-001.jpg)

Representative derivative from PHOTO-003 (`CASELABS_S8 - 3.HEIC`).

## Identification

- Provisional name: 8× vibration-isolated 3.5-inch HDD pedestal mount
- Part type: HDD tray / drive mount assembly
- Likely assembly: CaseLabs pedestal side-drive or pedestal storage bay assembly
- Quantity: 1 assembly
- Confidence: medium
- Unverified naming questions: Verify the official CaseLabs name and whether this was sold as a pedestal storage plate, side-drive mount, or another accessory.

## Physical Description

Large base plate carrying two sections with four drive positions each. The arrangement is intended to support eight vibration-isolated 3.5-inch mechanical hard drives.

## Condition

Unknown.

## Hardware Present

The operator reports that the original drive mounting hardware and
`FI-HDD-ICEPACK-001`, a retained set of WD IcePack mounting frames / heat sinks,
are present. Direct piece count, condition capture, and fit inspection remain
pending.

## Assigned Drive Set

`FI-HDD-001` registers the operator-reported set of eight WD VelociRaptor 450 GB
drives acquired for this mount around 2014. Four drives received preliminary
non-destructive inspection on 2026-07-20 and identified as 450.1 GB
`WD4500BLHX-01V7BV0` units. None presented a recognized partition map. Direct
read-only probes of the first three reported no physical I/O errors; the fourth
bridge session did not permit a direct raw-device read. No bridge session
exposed SMART data. The four drives remain test candidates, not certified array
members. Four drives remain to be inspected.

WD literature distinguishes `WD4500BLHX`, the 2.5-inch drive, from
`WD4500HLHX`, the 3.5-inch IcePack-equipped assembly. The retained IcePack
frames remain a separate carrier record until their count, part numbers,
revisions, and completeness are photographed.

The current design baseline is four mirrored pairs striped across the set, with
each mirror split across the two physical stacks. This is a proposed topology,
not a recovered historical configuration. The array must remain a working or
exhibition tier rather than the only copy of archive material.

## Build Relevance

Planned as the large pedestal storage plate / side-panel drive bay assembly for the Mercury S8 pedestal build. Orientation, attachment points, and clearance require reconciliation against the pedestal frame.

## Reconciliation

- [ ] Verify official CaseLabs part name.
- [ ] Verify chassis compatibility.
- [ ] Confirm orientation.
- [ ] Count and inspect the retained IcePack frames, adapters, thermal pads,
      screws, and rails.
- [ ] Qualify all eight drives by direct SATA SMART, self-test, and full read pass.
- [ ] Decide keep / install / spare / sell / archive.

## Notes

Future updates:
