# Cloudflare / GitHub Pages Launch Notes

Domain target: `forgotten-industries.net`

## Current Site Shape

Forgotten Industries is currently a static HTML archive deployed through GitHub Pages.

- No install step is required.
- The site entry point is `index.html`.
- Static pages and assets live at the repository root and in `assets/`.
- `npm run build` regenerates archive data in `dist/` before the GitHub Pages artifact is assembled.

## GitHub Pages Settings

Use GitHub Pages with the checked-in Actions workflow.

- Repository: `Forgotten-Industries/FORGOTTEN-INDUSTRIES`
- Publishing source: GitHub Actions
- Workflow: `.github/workflows/deploy-pages.yml`
- Custom domain: `forgotten-industries.net`
- HTTPS: enforce after GitHub provisions the certificate

The workflow stages a static `_site` artifact and deploys it with `actions/deploy-pages`.

## Domain Registration

Register `forgotten-industries.net` through Cloudflare Registrar if available.

Cloudflare will perform the definitive availability check during purchase. Domains registered through Cloudflare Registrar use Cloudflare nameservers, which is fine for this project because DNS and redirects can live in the same account while GitHub Pages serves the site.

## DNS Setup

For the apex domain, create GitHub Pages `A` records:

```text
forgotten-industries.net A 185.199.108.153
forgotten-industries.net A 185.199.109.153
forgotten-industries.net A 185.199.110.153
forgotten-industries.net A 185.199.111.153
```

Optional IPv6 records:

```text
forgotten-industries.net AAAA 2606:50c0:8000::153
forgotten-industries.net AAAA 2606:50c0:8001::153
forgotten-industries.net AAAA 2606:50c0:8002::153
forgotten-industries.net AAAA 2606:50c0:8003::153
```

For `www`, create:

```text
www CNAME forgotten-industries.github.io
```

Do not add wildcard DNS records for this domain.

## GitHub Custom Domain Setup

After DNS exists:

1. Open `Forgotten-Industries/FORGOTTEN-INDUSTRIES`.
2. Go to **Settings** -> **Pages**.
3. Set the custom domain to `forgotten-industries.net`.
4. Wait for DNS check and certificate provisioning.
5. Enable **Enforce HTTPS**.

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
