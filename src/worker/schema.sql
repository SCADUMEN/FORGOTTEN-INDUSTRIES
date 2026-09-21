CREATE TABLE IF NOT EXISTS sightings (
  id TEXT PRIMARY KEY,
  city TEXT NOT NULL,
  seen_at TEXT NOT NULL,
  note TEXT NOT NULL,
  colors TEXT NOT NULL DEFAULT '[]',
  logged_at INTEGER NOT NULL,
  -- Confidence tag, in the field-guide register the teaser established.
  -- Every report is born 'unverified'; promotion is a curatorial act
  -- performed out of band, never by the submitter.
  status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (status IN ('unverified', 'probable', 'confirmed'))
);

CREATE INDEX IF NOT EXISTS idx_sightings_seen_at ON sightings (seen_at DESC);
-- The public feed reads by status first, then orders by sighting date.
CREATE INDEX IF NOT EXISTS idx_sightings_status_seen_at
  ON sightings (status, seen_at DESC);
