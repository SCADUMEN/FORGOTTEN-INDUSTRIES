-- Adds the confidence tag to an already-provisioned jjammocan-sightings
-- database. SQLite cannot add a CHECK constraint to an existing column, so
-- rows written before this migration land as 'unverified' and the constraint
-- lives only in schema.sql for fresh databases.
ALTER TABLE sightings
  ADD COLUMN status TEXT NOT NULL DEFAULT 'unverified';

CREATE INDEX IF NOT EXISTS idx_sightings_status_seen_at
  ON sightings (status, seen_at DESC);
