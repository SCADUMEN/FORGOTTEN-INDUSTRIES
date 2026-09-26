-- Migration 0001: Bull Valley Scaduscope tag counter and names
-- (/api/scaduscope/tags, /api/scaduscope/names).
--
-- IF NOT EXISTS throughout, so it is safe on a database where these objects
-- were already created by hand from the old src/worker/schema.sql.

-- One shared running total of shadowmen tagged by every visitor. A single
-- row (id = 1), created by the first tag's upsert.
CREATE TABLE IF NOT EXISTS scaduscope_totals (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  tags INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0
);

-- Every name a tagged shadowman has been given, kept forever, with how many
-- times that name has been tagged. Names are chosen by the Worker from the
-- lists in src/assets/js/bull-valley-scaduscope/names.js, never by visitors.
CREATE TABLE IF NOT EXISTS scaduscope_names (
  name TEXT PRIMARY KEY,
  tags INTEGER NOT NULL DEFAULT 0,
  first_tagged_at INTEGER NOT NULL,
  last_tagged_at INTEGER NOT NULL
);

-- Everyone's field log reads the most recently tagged names.
CREATE INDEX IF NOT EXISTS idx_scaduscope_names_last_tagged
  ON scaduscope_names (last_tagged_at DESC);
