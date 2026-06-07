# Cloudflare Launch Notes

Domain target: `forgotten-industries.net`

## Current Site Shape

Forgotten Industries is currently a static archive with an Eleventy mirror.

- The raw HTML pages remain checked in at the repository root as durable reference shelves.
- The Eleventy entry point lives at `site/index.njk`.
- The deployable site is written to `_site/`.
- `npm run build` regenerates archive data in `dist/`.
- `npm run build:site` regenerates archive data and builds the Eleventy mirror.

## Recommended Cloudflare Pages Settings

Use Cloudflare Pages with Git integration.

- Project name: `forgotten-industries`
- Production branch: `main`
- Framework preset: `Eleventy`, or `None` with the settings below
- Build command: `npm run build:site`
- Build output directory: `_site`
- Root directory: repository root
- Environment variable: `NODE_VERSION=22`

This deploys the Eleventy-built mirror while copying the raw archive pages, source data, docs, posts, projects, and assets into the output.

## Domain Registration

Register `forgotten-industries.net` through Cloudflare Registrar if available.

Cloudflare will perform the definitive availability check during purchase. Domains registered through Cloudflare Registrar use Cloudflare nameservers, which is fine for this project because Pages, DNS, HTTPS, and redirects can all live in the same account.

## Custom Domain Setup

After the Pages project deploys:

1. Open the Cloudflare Pages project.
2. Go to **Custom domains**.
3. Add `forgotten-industries.net`.
4. Add `www.forgotten-industries.net` if the `www` form should resolve too.
5. Let Cloudflare create the DNS records automatically.

Recommended canonical host:

```text
https://forgotten-industries.net
```

The GitHub Pages workflow also builds `_site/`. GitHub's custom-domain setting remains the source of truth when deploying through a custom Actions workflow; `site/CNAME` is kept as a portability marker and for hosts that do read a checked-in CNAME file.

## Launch Verification

Check these paths after DNS and HTTPS finish provisioning:

- `https://forgotten-industries.net/`
- `https://forgotten-industries.net/about.html`
- `https://forgotten-industries.net/archive.html`
- `https://forgotten-industries.net/inventory.html`
- `https://forgotten-industries.net/social-posts.html`
- `https://forgotten-industries.net/assets/favicon/favicon-32x32.png`
- `https://forgotten-industries.net/dist/forgotten-industries.json`

## Notes

The Eleventy mirror should remain thin. Preserve the raw archive pages and generated data as the source of truth; use Eleventy to assemble the public surface, not to bury the evidence.
