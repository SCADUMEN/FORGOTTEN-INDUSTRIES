# Le Cadran — public exhibits

Sub-dossier of `FI-PROJ-006` (ATLAS). Public route: `/projects/atlas/le-cadran/`.

These files are rendered by ATLAS, not written here. They are copied from the
public ATLAS repository at commit `b5cf574` (PR #62,
https://github.com/SCADUMEN/ATLAS/pull/62) and published unchanged, so the
dial on this site is the dial the train actually draws.

| Published file | ATLAS source                    | Renderer         | sha256                                                                              |
| -------------- | ------------------------------- | ---------------- | ----------------------------------------------------------------------------------- |
| `sheet.html`   | `rouage/cadran.html`            | `rouage/dial.py` | `94519c74b11d49fbc3eada2d9ac7c983015e81853a4fff61f5f26f48f24ede23` (byte-identical) |
| `live.html`    | `rouage/cadran-live.html`       | `rouage/live.py` | source `fea948125d9c36b55dc1afd680663442e9dc85ee25ece719fdbe9044d85d23e8`           |
| `dial.svg`     | Plate 1 of `rouage/cadran.html` | `rouage/dial.py` | extracted                                                                           |

Two changes, both mechanical:

- `live.py` writes a page fragment (no doctype) for the Artifact viewer. To
  serve it standalone, `live.html` prepends a document head (doctype, `lang`,
  charset, viewport) and is otherwise the source byte for byte.
- `dial.svg` is the first `<svg>` element of the sheet (Plate 1, the trace for
  "run Publish, security check"), saved on its own with an XML declaration.

To refresh: re-render in ATLAS (`python3 rouage/dial.py`, `python3 rouage/live.py`),
repeat the copy, and update the commit and checksums above. Prettier ignores
the exhibits (`.prettierignore`) so formatting never rewrites them.
