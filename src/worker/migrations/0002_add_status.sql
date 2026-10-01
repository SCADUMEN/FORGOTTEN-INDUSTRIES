-- Migration 0002: confidence tag for JJAMMOCAN sightings (FI-PROJ-011).
--
-- Every report is born 'unverified'; promotion is a curatorial act performed
-- out of band, never by the submitter. ADD COLUMN carries the CHECK, so the
-- constraint holds on the production table and on fresh databases alike.
-- Rows that predate this migration take the default.

ALTER TABLE sightings
  ADD COLUMN status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (status IN ('unverified', 'probable', 'confirmed'));

-- The public feed reads by status first, then orders by sighting date.
CREATE INDEX IF NOT EXISTS idx_sightings_status_seen_at
  ON sightings (status, seen_at DESC);
