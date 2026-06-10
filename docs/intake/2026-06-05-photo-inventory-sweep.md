# 2026-06-05 Photo Inventory Sweep

## Sweep Summary

- Sweep ID: `FI-2026-06-05-PHOTO-SWEEP`
- Branch/workflow context: private staging branch
- Inventory date: 2026-06-05
- Status: local photographic evidence sets registered as collection-level inventory.

## Included Evidence Sets

- `FI-PHOTO-001` - `assets/initial-photos/`
  - 129 local files
  - 126 JPEG, 2 MOV, 1 PNG
  - Manifest: `docs/intake/2026-06-05-initial-photos.md`

- `FI-PHOTO-002` - `Splunking/`
  - 80 local files
  - 79 HEIC, 1 PNG
  - Manifest: `docs/intake/2026-06-05-splunking.md`

## Scope Note

Matthew referenced "the first 150" and "the 80 from today." In this working tree, the locally present files are 129 in `assets/initial-photos/` and 80 in `Splunking/`, for 209 newly registered source files in this sweep.

Existing recovered social-media assets remain tracked through `src/social-posts.yml`, `posts/social/`, and the REDEEMER evidence records already present in `src/inventory.yml`. This sweep does not duplicate those social records; it registers the two local raw/photo-source batches that needed collection-level inventory coverage.

## Next Pass

Use the collection records as the source of truth for file custody. Object-level mapping should happen later by assigning specific filenames to hardware records, dossiers, or field logs after visual identification is done from native viewers or curated derivatives.

## Object Mapping Update

First object-level mapping was completed in `docs/intake/2026-06-05-photo-object-map.md`. The pass added distinct inventory records for confirmed physical objects and temporary grouped records for CaseLabs panels, frames, trays, plates, and filter inserts.
