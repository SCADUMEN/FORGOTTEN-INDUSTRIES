# Repository Architecture

Forgotten Industries should be split into three deliberately named lanes:

1. `FI (src)`
   Canonical archive source for Matthew and ATLAS.

2. `FI (pub)`
   Public page shell and published content surface.

3. `secrets de mysterie`
   Private staging and sensitive material. This lane stays private everywhere.

GitHub repository slugs cannot reliably carry spaces and parentheses, so use the human-readable names in documentation and practical slugs in remotes.

## Proposed Repository Map

| Human name | Suggested slug | Visibility | Role |
| --- | --- | --- | --- |
| `FI (src)` | `fi-src` or `FORGOTTEN-INDUSTRIES` | private or restricted public | Canonical YAML, markdown drafts, internal archive notes, build scripts, generated data package. |
| `FI (pub)` | `fi-pub` or `forgotten-industries.net` | public | Eleventy/static public shell, public pages, deploy workflows, public assets, domain/CNAME. |
| `secrets de mysterie` | `secrets-de-mysterie` | private | Raw sensitive staging, private notes, credentials, private identity/account material, unredacted intake. |

## Boundary Rules

- `FI (src)` is the source of truth for archive records.
- `FI (pub)` consumes exported public content from `FI (src)`.
- `secrets de mysterie` never feeds deploys directly.
- Sensitive material is redacted or summarized before it leaves `secrets de mysterie`.
- Public deploys must not depend on private remotes, private branches, local-only paths, or credentials.
- Public content should be boring to host: static files, generated JSON, Markdown, images, and deploy config.

## Content Flow

```text
secrets de mysterie
  -> redacted/exported notes
FI (src)
  -> public archive bundle
FI (pub)
  -> domain deployment
forgotten-industries.net
```

## What Belongs Where

### `FI (src)`

- `src/*.yml`
- `src/types.ts`
- `scripts/build.rb`
- public-safe drafts before promotion
- public-safe project dossiers
- generated package outputs in `dist/`
- archive operating docs

### `FI (pub)`

- Eleventy config
- site layouts
- public CSS
- public pages
- public assets
- deployment workflows
- `CNAME`
- imported public bundle from `FI (src)`

### `secrets de mysterie`

- private staging branches
- sensitive raw notes
- credentials and account recovery details
- unredacted identity material
- private intake
- anything that would be painful if published accidentally

## Immediate Migration Path

1. Keep the current repository stable until the public site deploy path is proven.
2. Rename or create the public shell repository as `FI (pub)`.
3. Move Eleventy-specific files from this repository into `FI (pub)`:
   - `eleventy.config.cjs`
   - `site/`
   - `.github/workflows/deploy-pages.yml`
   - public deploy docs
4. Keep canonical archive data and package generation in `FI (src)`.
5. Create an explicit export step from `FI (src)` to `FI (pub)`.
6. Rename the private remote/repository to `secrets-de-mysterie` and keep it private.

## Naming Notes

Use these labels in conversation:

- `FI src`
- `FI pub`
- `secrets`

Use these slugs in commands and remotes:

- `fi-src`
- `fi-pub`
- `secrets-de-mysterie`

Do not use branch names like `secrets-working` for public work. Public work should use branches like:

- `pub/eleventy-shell`
- `src/archive-export`
- `docs/repo-split`

Private work should stay on the private remote and use clearly private names:

- `private/staging`
- `private/intake`
- `private/redaction`

The objective is simple: public pages can be rebuilt from public-safe exports, and private staging can never accidentally become the public site.
