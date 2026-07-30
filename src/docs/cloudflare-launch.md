# Cloudflare Worker Migration Record

Domain target: `forgotten-industries.net`

Migration state: `PREPARED / PREVIEW NOT YET DEPLOYED / DNS NOT CUT OVER`

## Deployment Boundary

Forgotten Industries remains a static Eleventy archive. The migration changes
the hosting instrument, not the archive build or public record boundary.

- Canonical public source remains under `src/`.
- `npm run build:site` remains the production build.
- `_site/` remains the only directory uploaded to the host.
- `npm run audit:public` must pass before deployment.
- `_redirects`, `_headers`, and `.well-known/security.txt` remain inside
  `_site/`.
- GitHub Pages remains the temporary production origin until the Worker preview
  and custom domain are both verified.

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

The durable deployment token does not need general DNS edit authority. Give it
no fixed expiration if long continuity is required, record its owner and scope,
and rotate it only for personnel, permission, or suspected-exposure events.

The initial migration may use a second short-lived local token with Zone / DNS /
Edit to remove the GitHub Pages web-origin records. Do not store that migration
token as an organization secret; revoke it after the cutover.

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

## GitHub Organization Secrets

Install these as organization-level Actions secrets under `SCADUMEN`:

```text
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
```

Use `visibility: all` only while every repository in the organization is inside
the same trusted deployment boundary. That setting automatically makes the
secrets available to future repositories. GitHub does not provide prefix-based
organization-secret visibility; `selected` visibility requires adding every new
repository manually.

The account ID is not itself a credential, but it remains a secret here so every
Forgotten Industries workflow consumes the same two-name contract. Never print
the token in Action logs or expose it to pull-request workflows from forks.

The manual `.github/workflows/deploy-worker-preview.yml` workflow consumes the
organization secrets without repository-specific configuration.

The preview workflow does not run on pushes. It builds and audits the archive,
validates the Worker bundle, deploys the `forgotten-industries` Worker to its
`workers.dev` hostname, and runs the release verifier against the deployed
routes. Every `workers.dev` response carries `X-Robots-Tag: noindex`; the
production custom domain remains indexable. The current GitHub Pages workflow
continues to own production during this verification phase.

## Cutover Sequence

1. Deploy the Worker preview.
2. Confirm the automated `npm run verify:worker` checks for the homepage,
   representative route families, `_redirects`, `.well-known/security.txt`, the
   feed, sitemap, public JSON, a true 404, and the preview noindex header.
3. Add `forgotten-industries.net` as a Worker Custom Domain.
4. Verify the Cloudflare-issued certificate and production responses.
5. Replace the preview-only workflow with the `main` deployment trigger.
6. Remove `.github/workflows/deploy-pages.yml` and the obsolete root `CNAME`
   marker.
7. Disable GitHub Pages only after the Worker is confirmed live.
8. Revoke the short-lived migration token; retain the organization deployment
   token.

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

The migration is complete only when those public checks pass through
Cloudflare and the GitHub Pages deployment owner has been retired.
