// BULL VALLEY SCADUSCOPE field log: every shadowman you've tagged and named,
// newest first, kept in this browser (localStorage) across visits. The shared,
// permanent record of names lives server-side (scaduscope_names in D1); this
// is your own notebook of the ones you met.

const STORAGE_KEY = 'bull-valley-scaduscope:v1:log'
export const MAX_ENTRIES = 100

// Entry: { name, timesTagged, recorded, at (ISO), local ("HH:MM" Bull Valley) }
export function readLog() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(parsed)
      ? parsed.filter((e) => e && typeof e.name === 'string')
      : []
  } catch (err) {
    return []
  }
}

// Adds an entry to the front, trims to MAX_ENTRIES, saves, and returns the log.
export function appendLog(log, entry) {
  const next = [entry, ...log].slice(0, MAX_ENTRIES)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch (err) {
    /* storage unavailable — the log lasts for this visit only */
  }
  return next
}

// "Tagged 14×", "First Sighting", or "Unrecorded" (the shared record was
// unreachable when it was tagged).
export function entryNote(entry) {
  if (!entry.recorded) return 'Unrecorded'
  return entry.timesTagged > 1
    ? `Tagged ${entry.timesTagged}×`
    : 'First Sighting'
}
