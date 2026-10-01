-- Migration 0000: JJAMMOCAN sighting intake (/api/sightings).
--
-- IF NOT EXISTS throughout: the production database already has this table
-- (it was applied by hand from the old src/worker/schema.sql), so applying
-- this migration there only records it in d1_migrations.

CREATE TABLE IF NOT EXISTS sightings (
  id TEXT PRIMARY KEY,
  city TEXT NOT NULL,
  seen_at TEXT NOT NULL,
  note TEXT NOT NULL,
  colors TEXT NOT NULL DEFAULT '[]',
  logged_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sightings_seen_at ON sightings (seen_at DESC);
