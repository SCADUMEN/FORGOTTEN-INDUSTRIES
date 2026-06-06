# Cloudflare Launch Notes

Domain target: `forgotten-industries.net`

## Current Site Shape

Forgotten Industries is currently a static HTML archive.

- No install step is required.
- No framework preset is required.
- The site entry point is `index.html`.
- Static pages and assets live at the repository root and in `assets/`.
- `npm run build` only regenerates archive data in `dist/`; it does not build the HTML site.

## Recommended Cloudflare Pages Settings

Use Cloudflare Pages with Git integration.

- Project name: `forgotten-industries`
- Production branch: `main`
- Framework preset: `None`
- Build command: blank, or `exit 0` if Cloudflare requires a command
- Build output directory: `/`
- Root directory: repository root

This deploys the checked-in static archive directly.

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

## Launch Verification

Check these paths after DNS and HTTPS finish provisioning:

- `https://forgotten-industries.net/`
- `https://forgotten-industries.net/about.html`
- `https://forgotten-industries.net/archive.html`
- `https://forgotten-industries.net/inventory.html`
- `https://forgotten-industries.net/social-posts.html`
- `https://forgotten-industries.net/assets/favicon/favicon-32x32.png`

## Notes

Do not move the archive into a heavier site generator just for launch. Publish the stable static version first, then improve structure once the first post and domain are alive.
