# Cloudflare Worker Migration Record

Domain target: `forgotten-industries.net`

Migration state: `COMPLETE / CLOUDFLARE WORKER PRODUCTION`

## Deployment Boundary

Forgotten Industries remains a static Eleventy archive. The migration changes
the hosting instrument, not the archive build or public record boundary.

- Canonical public source remains under `src/`.
- `npm run build:site` remains the production build.
- `_site/` remains the only directory uploaded to the host.
- `npm run audit:public` must pass before deployment.
- `_redirects`, `_headers`, and `.well-known/security.txt` remain inside
  `_site/`.
- Cloudflare Workers Static Assets owns the production custom domain.

## Prepared Worker

`wrangler.jsonc` defines an asset-only Worker named `forgotten-industries`.
There is no application Worker script and no server-side archive state. Static
assets are served directly from `_site/` with Cloudflare's automatic HTML path
handling.

Local verification:

```bash
npm ci
npm run build:site
npm run audit:public
npm run worker:dry-run
```

Authenticated preview deployment:

```bash
CLOUDFLARE_ACCOUNT_ID='<account-id>' \
CLOUDFLARE_API_TOKEN='<token>' \
npm run deploy:worker
```

Do not place either value in the repository, a committed environment file, a
shell-history-bearing command, an issue, or a chat message.

## Cloudflare API Access

Create a durable deployment token in Cloudflare and restrict it to the one
Forgotten Industries account and the `forgotten-industries.net` zone. The token
is owned operationally by the `SCADUMEN` GitHub organization, not by an
individual repository.

Required for Worker deployment and future Custom Domains such as
`watches.forgotten-industries.net`:

- Account / Workers Scripts / Edit
- Account / Account Settings / Read
- Zone / Workers Routes / Edit
- Zone / Zone / Read

The durable deployment token does not have general DNS edit authority. It is
restricted to the Forgotten Industries account and zone. Record its owner and
scope, and rotate it for personnel, permission, or suspected-exposure events.

Verify a user API token without printing it:

```bash
curl 'https://api.cloudflare.com/client/v4/user/tokens/verify' \
  --header "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
```

The direct API base is:

```text
https://api.cloudflare.com/client/v4
```

Useful read-only preflight endpoints:

```text
GET /zones?name=forgotten-industries.net
GET /accounts/{account_id}/workers/scripts
GET /accounts/{account_id}/workers/scripts/forgotten-industries/deployments
```

The static asset upload protocol is multi-step. Wrangler uses these same
Cloudflare APIs, including the Worker assets upload-session endpoint, while
handling manifests, deduplication, multipart upload, and deployment creation.
Use Wrangler for the asset transfer and use the direct API for verification,
DNS inventory, custom-domain inspection, and audit records.

## GitHub Actions Secrets

The canonical repository stores these as repository-level Actions secrets:

```text
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
```

The account ID is not itself a credential, but it remains a secret here so every
Forgotten Industries workflow consumes the same two-name contract. Never print
the token in Action logs or expose it to pull-request workflows from forks.

The `.github/workflows/deploy-worker.yml` workflow runs on every push to `main`
and by manual dispatch. It builds and audits the archive, validates the Worker
bundle, deploys the `forgotten-industries` Worker, and runs the release verifier
against both the production custom domain and the `workers.dev` hostname. Every
`workers.dev` response carries `X-Robots-Tag: noindex`; the production custom
domain remains indexable.

## Cutover Record

The production cutover completed on 2026-07-30.

1. The `workers.dev` preview passed the automated release verifier.
2. The four GitHub Pages apex A records were removed.
3. `forgotten-industries.net` was attached as the Worker Custom Domain.
4. Production passed the 13-endpoint verifier through Cloudflare, including
   `.well-known/security.txt`, `_redirects`, public data, the field-terminal ZIP,
   and a true 404.
5. The legacy `www` GitHub CNAME was replaced with a proxied placeholder record
   and an active 301 redirect to the apex that preserves path and query string.
6. Mail-routing, SPF, and DKIM records were preserved.
7. The Pages workflow and root `CNAME` marker were retired in favor of the
   `main` Worker deployment workflow.

Cloudflare already operates the authoritative nameservers for this zone. During
cutover, preserve all mail-routing and verification records; only the existing
GitHub Pages web-origin records are in scope.

## Production Custom Domain Configuration

After the preview is accepted, add the apex Custom Domain to `wrangler.jsonc`:

```json
"routes": [
  {
    "pattern": "forgotten-industries.net",
    "custom_domain": true
  }
]
```

The apex is canonical. Handle `www.forgotten-industries.net` with a Cloudflare
redirect to the apex rather than a second archive origin.

Future Worker projects can attach exact subdomains such as
`watches.forgotten-industries.net` through their own `wrangler.jsonc` Custom
Domain entry. No wildcard DNS or wildcard Worker route is required.

## Release Verification

At minimum, verify:

- `https://forgotten-industries.net/`
- `https://forgotten-industries.net/l-archive/`
- `https://forgotten-industries.net/oeuvre/`
- `https://forgotten-industries.net/signal/`
- `https://forgotten-industries.net/apropos/`
- `https://forgotten-industries.net/.well-known/security.txt`
- `https://forgotten-industries.net/feed.xml`
- `https://forgotten-industries.net/sitemap.xml`
- `https://forgotten-industries.net/dist/forgotten-industries.json`
- a legacy path from `_redirects`
- a nonexistent path returning HTTP 404

The migration is complete when those public checks pass through Cloudflare and
the GitHub Pages deployment owner remains retired.
