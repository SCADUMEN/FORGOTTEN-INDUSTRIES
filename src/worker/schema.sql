CREATE TABLE IF NOT EXISTS sightings (
  id TEXT PRIMARY KEY,
  city TEXT NOT NULL,
  seen_at TEXT NOT NULL,
  note TEXT NOT NULL,
  colors TEXT NOT NULL DEFAULT '[]',
  logged_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sightings_seen_at ON sightings (seen_at DESC);

-- Bull Valley Scaduscope: one shared running total of shadowmen tagged by
-- every visitor. A single row (id = 1), created by the first tag's upsert.
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
