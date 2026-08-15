# Atlas, the Archive Docent

`atlas-archive-docent-spritesheet.webp` is the public visual source for Atlas,
the Archive Docent. It is a byte-identical copy of the installed local ATLAS v2
pet sprite sheet authorized for the Forgotten Industries dossier on 2026-08-09.

Public record:

- SHA-256: `8497f764eab890f3a91b12b54417c38e14a4a998d44d0af6e30f29623ebd66bc`
- Format: WebP
- Dimensions: 1536 x 2288 pixels
- Color space: RGBA (RGB + alpha)
- Embedded color profile: none reported by macOS ImageIO
- Local filesystem path, package metadata, and workstation identity: not
  published
- Display rule: pages render the extracted cell derivative below; the archived
  public asset remains byte-identical to its preserved source and is linked
  whole from the ATLAS dossier for inspection

Before publication, the copied file had its macOS extended attributes cleared.
The repository location-metadata scrub and complete public-surface audit remain
release gates.

## Display derivative

`atlas-archive-docent-cell-01.webp` is the authored frame the dossier shows. It
is the first 192 x 208 animation cell extracted from the preserved sheet with a
lossless WebP re-encode, so the displayed pixels are identical to the source
frame. Rendering it instead of the whole sheet keeps 2.65 MB of unshown
animation cells off every page that only ever displayed one frame.

Derivative record:

- SHA-256: `e54ddb987b65af6150892c1640f2798b4ab0a3af1215886bf7961d8421ccbfae`
- Format: WebP, lossless, RGBA
- Dimensions: 192 x 208 pixels
- Derived from: `atlas-archive-docent-spritesheet.webp`, cell (0, 0)
- Regenerate with: `node scripts/build_atlas_cell.cjs`
