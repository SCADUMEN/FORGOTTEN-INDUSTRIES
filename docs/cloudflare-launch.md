# Cloudflare / GitHub Pages Launch Notes

Domain target: `forgotten-industries.net`

## Current Site Shape

Forgotten Industries is currently a static archive with an Eleventy public mirror deployed through GitHub Pages.

- The raw HTML pages remain checked in at the repository root as durable reference shelves.
- The Eleventy entry point lives at `site/index.njk`.
- The deployable site is written to `_site/`.
- `npm run build` regenerates archive data in `dist/`.
- `npm run build:site` regenerates archive data and builds the Eleventy mirror.

## GitHub Pages Settings

Use GitHub Pages with the checked-in Actions workflow.

- Repository: `Forgotten-Industries/FORGOTTEN-INDUSTRIES`
- Publishing source: GitHub Actions
- Workflow: `.github/workflows/deploy-pages.yml`
- Custom domain: `forgotten-industries.net`
- HTTPS: enforce after GitHub provisions the certificate

The workflow installs dependencies, runs `npm run build:site`, preserves `_site/.nojekyll`, and deploys the `_site` artifact with `actions/deploy-pages`.

## Domain Registration

Register `forgotten-industries.net` through Cloudflare Registrar if available.

Cloudflare will perform the definitive availability check during purchase. Domains registered through Cloudflare Registrar use Cloudflare nameservers, which is fine for this project because DNS and the site are coupled by design.

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

The GitHub Pages custom-domain setting remains the source of truth for the deployed Actions artifact. `site/CNAME` is kept as a portability marker and is copied into `_site/` by the Eleventy build.

## Launch Verification

Check these paths after DNS and HTTPS finish provisioning:

- `https://forgotten-industries.net/`
- `https://forgotten-industries.net/about.html`
- `https://forgotten-industries.net/archive.html`
- `https://forgotten-industries.net/inventory.html`
- `https://forgotten-industries.net/social-posts.html`
- `https://forgotten-industries.net/assets/favicon/favicon-32x32.png`
- `https://forgotten-industries.net/dist/forgotten-industries.json`

## Phase 1 Coherence Setup

The public archive has one canonical spine:

- Domain: `https://forgotten-industries.net`
- Contact: `contact@forgotten-industries.net`
- Archive mail: `archive@forgotten-industries.net`
- Field Notes mail: `fieldnotes@forgotten-industries.net`
- GitHub source: `https://github.com/Forgotten-Industries/FORGOTTEN-INDUSTRIES`
- Eleventy static site generator: `https://www.11ty.dev/`

The live site renders GitHub, Eleventy, contact, and Field Notes links from `site/_data/site.cjs`.

### Email

Use Cloudflare Email Routing for receive-only forwarding if the domain is managed in Cloudflare. Route:

- `contact@forgotten-industries.net`
- `archive@forgotten-industries.net`
- `fieldnotes@forgotten-industries.net`

If sending as `@forgotten-industries.net` becomes important, move to a mailbox provider such as Google Workspace, Fastmail, or Proton and update the domain DNS records accordingly.

### Analytics

The base layout has optional GA4 support. To activate it, add the measurement ID in `site/_data/site.cjs`:

```js
analytics: {
  googleMeasurementId: "G-XXXXXXXXXX"
}
```

Tracked link hooks already exist through `data-track` attributes for GitHub, Eleventy, contact, and Field Notes subscription clicks.

### Subscription List

Phase 1 uses a domain email link for Field Notes. When the newsletter provider is selected, replace `fieldNotesSubscribeUrl` in `site/_data/site.cjs` with the provider-hosted subscription URL.

Recommended public framing:

```text
Field notes from the Forgotten Industries archive.
```

### Monetization

Do not place ads on the archive in Phase 1. Keep `supportUrl` blank until there is a clear support destination, such as GitHub Sponsors or a dedicated support page for restoration costs.

## Notes

The Eleventy mirror should remain thin. Preserve the raw archive pages and generated data as the source of truth; use Eleventy to assemble the public surface, not to bury the evidence.