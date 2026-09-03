CREATE TABLE IF NOT EXISTS sightings (
  id TEXT PRIMARY KEY,
  city TEXT NOT NULL,
  seen_at TEXT NOT NULL,
  note TEXT NOT NULL,
  colors TEXT NOT NULL DEFAULT '[]',
  logged_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sightings_seen_at ON sightings (seen_at DESC);
