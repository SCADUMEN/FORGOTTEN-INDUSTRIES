# Archive Photo Procedure

Source: Forgotten Industries photo archive chat export, 2026-06-05.

Use this procedure when cataloging newly recovered hardware, parts, panels, accessories, or unknown objects. The goal is to preserve evidence before interpretation. Photograph first, sort second, clean later.

For high-volume fixed-camera intake, use this with `docs/obs-archive-station-procedure.md`.

## Core Rule

The build is the artifact. The archive is the project.

Treat the collection like an archaeological intake:

1. Record the whole scene before moving anything.
2. Group items by visible function.
3. Assign durable object IDs.
4. Photograph each object before cleaning or repair.
5. Leave enough context that a future reader can reconstruct what was found, where, and in what state.

## First Capture

Before sorting, take a complete Day 1 overhead or room-view photograph of the full collection.

Suggested label:

```text
FORGOTTEN INDUSTRIES
CASELABS ARCHIVE
DAY 1
2026-06-05
```

This image is the master evidence photo for the intake state.

## Sorting Pass

Start with broad groups, not perfect identifications:

- Panels and chassis parts
- Mounting hardware and brackets
- Pumps, reservoirs, fittings, and watercooling parts
- Radiators and fan hardware
- Cables, controllers, and electronics
- Fasteners, rails, trays, and small unknowns
- Documents, packaging, labels, and provenance evidence

Unknown parts should stay visible and receive temporary IDs. Do not wait for certainty before documenting them.

## Object IDs

Use simple sequential IDs for individual objects:

```text
P001
P002
P003
```

Keep the ID visible in the photo when possible. A paper card, painter's tape label, or temporary tag is enough. The ID should later map to `src/data/inventory.yml` or a project dossier.

Recommended minimum notes for each ID:

- Object ID
- Short description
- Group or category
- Condition
- Known compatibility or likely system
- Location found
- Photo filenames
- Open questions

## Photo Station

Create a repeatable artifact station:

- Stable table or clean floor space
- Neutral background
- Good diffuse light
- Tripod
- Object ID card
- Scale reference when useful
- Same camera orientation for repeated parts

Do not make the station precious. Consistency matters more than polish.

## iPhone Camera Settings

For iPhone archive photography:

- Format: High Efficiency / HEIF
- Resolution: 48 MP HEIF for master archive shots
- Lens: 1x / 24 mm for most documentation
- Detail lens: 35 mm for close part identification
- Ratio: 4:3
- Grid: enabled
- Stabilization: tripod plus 3-second timer

Avoid Portrait mode for archive shots. Avoid ultrawide except for room overviews where distortion is acceptable and context matters more than measurement.

Use HEIF + 48 MP for masters, not RAW, unless there is a specific restoration or print need.

## Minimum Shot Set

For each object or group, capture:

1. Context shot showing the group or table section.
2. Front or primary face.
3. Back or underside.
4. Left and right sides when geometry matters.
5. Any labels, serials, model numbers, damage, wear, cuts, or modifications.
6. Scale or fitment reference when size is ambiguous.

For unidentified parts, add extra angles before separating them from nearby objects.

## Handling Order

Default sequence:

1. Whole-scene evidence photo.
2. Broad group photos.
3. Temporary IDs.
4. Individual object photos.
5. Notes and condition.
6. Cleaning or disassembly.
7. Final identified inventory records.

If something looks fragile, rare, modified, or historically important, slow down and photograph more than seems necessary.

## Naming Guidance

Use names that preserve date, project, object ID, and angle:

```text
2026-06-05-caselabs-archive-day1-overview-001.heic
2026-06-05-caselabs-p001-front.heic
2026-06-05-caselabs-p001-label.heic
2026-06-05-caselabs-p001-damage.heic
```

Do not depend on camera roll order alone. The filename should survive export, migration, and future rebuilds.

## Archive Principle

Document before judgment.

The first pass is not about knowing what every part is. It is about preserving what was present before memory, cleaning, sorting, and enthusiasm start changing the evidence.
