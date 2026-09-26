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
