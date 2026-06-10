# OBS Archive Station Procedure

Source: [ATLAS dossier shared from ChatGPT](https://chatgpt.com/s/t_6a232ebe88f081918a159ba2f09df57e), 2026-06-05.

Use this procedure when a fixed camera and OBS Studio are faster than handheld photography. It is meant for high-volume intake of CaseLabs panels, brackets, watercooling hardware, fasteners, and unknown parts before cleaning, restoration, sale, or assembly decisions.

Run this alongside `docs/archive-photo-procedure.md`: the iPhone procedure handles flexible master shots, closeups, and room context; the OBS station handles repeatable bench captures.

## Mission

Convert the disassembled collection into a searchable archive before the parts are disturbed.

Primary rule:

```text
Preserve information first.
Restore second.
```

The archive is the artifact at this stage. The restoration is a later story the archive can support.

## Hardware

Recommended station:

- Logitech Brio 4K or equivalent webcam
- Tripod or fixed overhead mount
- USB-C connection to the MacBook
- White foam board or poster board background
- Consistent diffuse lighting
- Stable work surface
- Printed, index-card, or dry-erase object ID card
- Scale reference when dimensions matter

Lock the camera height and angle for the whole session when possible. Consistency is more important than cinematic polish.

## OBS Setup

Create a scene collection named:

```text
Forgotten Industries Archive Station
```

Minimum setup:

1. Add the webcam as the main video source.
2. Set the capture canvas to the camera's useful resolution.
3. Set the recording path to the current intake folder.
4. Assign a hotkey for `Screenshot Output` in OBS Settings > Hotkeys.
5. Capture one test screenshot and confirm the PNG lands in the expected folder.

OBS screenshots taken through `Screenshot Output` are saved as PNG files to the configured recording path. If screenshots do not appear immediately, check the recording path before changing the workflow.

Reference: [OBS Project forum note on screenshot output behavior](https://obsproject.com/forum/threads/screenshot-feature.78637/post-406671).

## Scene Structure

Use three simple scenes.

## Scene 1: Parts Catalog

Purpose:

- Fast inventory photographs
- One item or one logical group per capture
- Full object visible
- ID card in frame

Use for:

- Panels
- Brackets
- Fan mounts
- Motherboard trays
- Pedestal components
- Rails
- Small hardware groups
- Unknown parts

## Scene 2: Identification

Purpose:

- Model, label, and part-number verification
- Digital zoom crop
- Tighter light and focus

Use for:

- Aqua Computer labels
- EK blocks and radiators
- Pump tops
- Fan labels
- CaseLabs markings
- Serial numbers
- Damage or modification evidence

## Scene 3: Build Log

Purpose:

- Wider process documentation
- Cleaning, assembly, and restoration evidence
- Time-lapse or short recording when motion matters

Use for:

- Assembly sequence
- Cleaning passes
- Test fitting
- Cable or tube routing
- Before/after comparisons

## Capture Folder

Use a capture folder outside the canonical repo until images are curated, then import selected assets into the archive.

Recommended working structure:

```text
Forgotten_Industries_Archive/
  Panels/
  Brackets/
  Hardware/
  Motherboard_Trays/
  Pump_Tops/
  Reservoirs/
  Radiators/
  Fans/
  AquaComputer/
  EK/
  Unknown/
```

Do not depend on camera-roll order alone. Move or rename files only after the object ID is known.

## Object IDs

Use one ID scheme per intake batch.

For a large hardware intake, category-prefixed IDs are useful:

```text
PANEL-001
BRACKET-001
RAD-001
PUMP-001
UNKNOWN-001
```

For smaller or mixed batches, the simpler IDs from `docs/archive-photo-procedure.md` are still valid:

```text
P001
P002
P003
```

Once assigned, keep the ID stable. Add aliases or notes later rather than renaming the original record.

## Metadata Card

Minimum card:

```text
RAD-003

EK XTX 360

Condition:
B

Notes:
Minor fin damage
```

Use the condition scale from the main photo procedure unless a project-specific scale exists:

```text
A = Excellent
B = Good
C = Functional / cosmetic wear
D = Restoration required
X = Unknown
```

## Capture Loop

For each object:

1. Place item under camera.
2. Place object ID card beside item.
3. Capture Scene 1 screenshot.
4. Capture Scene 2 screenshot for labels, marks, damage, or uncertainty.
5. Record notes only if needed.
6. Move item to completed area.

Target pace after setup:

```text
10-20 seconds per simple object
```

Slow down for rare, fragile, modified, or historically important parts.

## Unknown Parts

Do not stop cataloging to solve an identification problem.

Assign:

```text
UNKNOWN-001
UNKNOWN-002
UNKNOWN-003
```

Capture extra angles, then move on. Research belongs after the intake pass.

## Operating Sequence

Recommended archive phases:

1. Archive
2. Identify
3. Restore
4. Assemble
5. Publish

The archive station exists to protect momentum. A named object can be researched, restored, sold, rebuilt, or written about later. An undocumented object can still disappear inside memory.
