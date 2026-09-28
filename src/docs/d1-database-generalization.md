# D1 Database Generalization

Current database: `forgotten-industries` (binding `DB`, id
`0ba6a720-90a4-4de9-85b6-e454be150e04`)

Previous database: `jjammocan-sightings` (id
`e909c0a4-b968-4b56-b673-b6351c3eef62`), kept for rollback until 2026-10-28

State: `PHASE 1 APPLIED 2026-09-28 / PHASE 2 SWITCHED 2026-09-28`

Both databases are in the Cloudflare account `f6ea8d308195655d2149be349d7bc4e0`
(the one serving `forgotten-industries.bagelmanrichard.workers.dev`).
`wrangler.jsonc` pins it as `account_id`, so local `wrangler` commands reach it
even when the login can see several accounts.

## Resolved 2026-09-28: Production Was Missing the Scaduscope Tables

Both migrations were applied to `jjammocan-sightings` on 2026-09-28, and
`/api/scaduscope/tags` and `/names` returned 200. The steps below are kept as
the record of the fix.

Recorded 2026-09-26, after #161 deployed. For Matthew, or ATLAS working on his
behalf in his terminal. Every step is read-only except step 3.

Evidence, from the live site:

| Endpoint                    | Response                                                 |
| --------------------------- | -------------------------------------------------------- |
| `GET /api/sightings`        | `200 {"sightings":[]}`: the database is reachable        |
| `GET /api/scaduscope/tags`  | `500 {"error":"The tally is unavailable right now."}`    |
| `GET /api/scaduscope/names` | `500 {"error":"The name log is unavailable right now."}` |

#161 needed its schema applied to the remote database before deploying, and
that step did not run, so `scaduscope_totals` and `scaduscope_names` do not
exist. Until they do, every tag on `/bull-valley-scaduscope/` scores only in
the visitor's browser (names marked "Unrecorded") and the shared total and
Everyone log stay offline. Tags made in the meantime are not recoverable into
the shared record.

1. Confirm Wrangler is signed in to the account that owns the database. The
   database must appear in the list; if it does not, stop and run
   `npx wrangler login` with the right account.

   ```bash
   npx wrangler d1 list
   ```

   Expected: a row named `jjammocan-sightings` with id
   `e909c0a4-b968-4b56-b673-b6351c3eef62`.

2. From a checkout of `main` with this change merged, preview what will run:

   ```bash
   npx wrangler d1 migrations list jjammocan-sightings --remote
   ```

   Expected: `0000_sightings.sql` and `0001_scaduscope.sql` listed as
   unapplied.

3. Apply them. Wrangler asks for confirmation; both files are
   `CREATE ... IF NOT EXISTS`, so the existing `sightings` table and its rows
   are untouched.

   ```bash
   npx wrangler d1 migrations apply jjammocan-sightings --remote
   ```

   Expected: both migrations marked ✅.

   If this change is not merged yet, the same fix from current `main` is
   `npx wrangler d1 execute jjammocan-sightings --remote --file=src/worker/schema.sql`.
   Applying the migrations later is still safe.

4. Verify on the live site. No redeploy is needed.

   ```bash
   curl -s https://forgotten-industries.net/api/scaduscope/tags
   curl -s https://forgotten-industries.net/api/scaduscope/names
   ```

   Expected: `{"tags":0,"points":0}` and `{"names":[]}` with status 200. Then
   tag a shadowman on `/bull-valley-scaduscope/`: the name card should say
   "First Sighting" rather than "Unrecorded", and it should appear under Field
   Log → Everyone.

## Why

The site's one D1 database was created for a single feature, the JJAMMOCAN
sighting intake, and is named for it. Since the Bull Valley Scaduscope (#161)
it also holds `scaduscope_totals` and `scaduscope_names`, so the name no longer
describes what is inside, and every future feature that needs storage would
make that worse. The database should be named for the site it serves, the way
the Worker already is (`forgotten-industries` in `wrangler.jsonc`).

The Worker code is already general. It only ever refers to the binding `DB`,
never the database name, so no application code changes. What changes is the
Cloudflare resource and the two config lines that point at it.

The schema was also applied by hand from a single `src/worker/schema.sql`,
with no record of which statements had run against which database. That is
workable for one table, but not for a database that several features share.

## Constraints

- D1 has no rename. The `wrangler d1` subcommands are `create`, `info`,
  `list`, `delete`, `execute`, `export`, `time-travel`, `migrations`, and
  `insights`. Renaming therefore means creating a new database, copying the
  data across, and pointing the Worker at it.
- The database lives in the Cloudflare account that deploys the site. Only
  someone with access to that account can run phase 2.
- Production reads and writes `jjammocan-sightings` until the config change
  deploys. Anything written there between the export and that deploy has to be
  carried over separately (see Cutover Window).

## Phase 1: Migrations (this change, safe to merge)

The schema moves from `src/worker/schema.sql` into numbered D1 migrations:

- `src/worker/migrations/0000_sightings.sql`: the sighting intake table and
  index.
- `src/worker/migrations/0001_scaduscope.sql`: the Scaduscope tables and index.

`wrangler.jsonc` points D1 at them with `migrations_dir`. Wrangler records
each applied migration in a `d1_migrations` table inside the database and only
applies the ones not yet recorded, so any database can be brought up to date
with one command, and each future schema change is a reviewable file.

Every statement is `CREATE ... IF NOT EXISTS`. On the existing database, where
these tables were created by hand, applying the migrations changes nothing
except recording them. After merging, the account holder runs once:

```bash
npx wrangler d1 migrations apply jjammocan-sightings --remote
```

Wrangler lists the migrations it will apply and asks for confirmation, and
warns that the database may be briefly unavailable while they run. This also
creates the Scaduscope tables if #161's schema step was never run against
production.

Rehearsed locally (`--local` against throwaway databases):

- A fresh database: both migrations apply and create every table and index.
- A database built from the old `schema.sql` holding sightings, a total, and
  names: both migrations apply, every row is unchanged, and a second run
  reports "No migrations to apply".

## Phase 2: Move to `forgotten-industries` (account holder)

Run from a checkout of `main` with phase 1 merged, authenticated to the
account that owns `jjammocan-sightings`. Pick a quiet time.

1. Create the new database and note the `database_id` it prints:

   ```bash
   npx wrangler d1 create forgotten-industries
   ```

2. Export the current database, schema and data, to a local file. Keep this
   file off the repository; it contains visitor submissions. (`d1-backup*.sql`
   is gitignored so it can't be committed by accident.)

   ```bash
   npx wrangler d1 export jjammocan-sightings --remote --output=d1-backup.sql
   ```

3. Load it into the new database, then apply migrations. The export carries
   the `d1_migrations` history, so if phase 1 was applied this reports nothing
   to apply; if not, it applies both (harmlessly).

   ```bash
   npx wrangler d1 execute forgotten-industries --remote --file=d1-backup.sql
   npx wrangler d1 migrations apply forgotten-industries --remote
   ```

4. Verify the copy. Each count must match between the two databases:

   ```bash
   for db in jjammocan-sightings forgotten-industries; do
     npx wrangler d1 execute "$db" --remote --command \
       "SELECT (SELECT COUNT(*) FROM sightings) AS sightings,
               (SELECT COUNT(*) FROM scaduscope_names) AS names,
               (SELECT tags FROM scaduscope_totals) AS tags"
   done
   ```

5. Open a PR changing the D1 entry in `wrangler.jsonc` to
   `"database_name": "forgotten-industries"` and the new `database_id`, and
   update the database name in `README.md`. Merging it deploys the switch.

6. After the deploy, repeat step 4. If the old database gained rows after the
   export, carry them over (see Cutover Window) before going further.

7. Keep `jjammocan-sightings` untouched for at least 30 days, then delete it:

   ```bash
   npx wrangler d1 delete jjammocan-sightings
   ```

The move was rehearsed locally end to end (export, import, apply, compare):
every row in the new database matched the old, and the migration history came
across with it.

## Cutover Window

Between step 2 and the deploy in step 5, production still writes to
`jjammocan-sightings`: new sightings, tags, and names. Keep the window short.
If step 6 shows new rows, the simplest recovery is to repeat steps 2–4 against
a freshly emptied `forgotten-industries` (delete and recreate it, then update
the `database_id` in the step 5 PR) before merging. For a handful of rows,
copying them by hand with `INSERT` statements is also fine; the tables are
small.

## Rollback

- Before step 7, rolling back is reverting the step 5 PR: the Worker points at
  `jjammocan-sightings` again, which still holds everything up to the switch.
- D1 Time Travel is always on and restores a database to any point in the last
  30 days (Workers Paid; 7 days on Free) with
  `npx wrangler d1 time-travel restore <database> --timestamp=<unix-timestamp>`.
  It protects each database against bad writes. It is not a substitute for
  keeping the old database until the new one has proven itself.

## Not Included

Deploys do not apply migrations; `.github/workflows/deploy-worker.yml` never
touches D1. Adding `wrangler d1 migrations apply forgotten-industries
--remote` to that workflow would keep the schema in step with every deploy,
but it needs the deploy token to carry D1 edit permission. That is a separate
decision for whoever holds the account.
