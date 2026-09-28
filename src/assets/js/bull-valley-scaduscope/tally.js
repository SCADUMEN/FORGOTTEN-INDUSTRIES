// BULL VALLEY SCADUSCOPE tally: the light game layer. Clicking a shadowman
// tags it (once per visit); each tag scores 1, or 2 during the witching hour.
//
// Three numbers:
//  - this visit: resets on reload
//  - all time: yours, kept in this browser's localStorage
//  - everyone: the shared total across all visitors, from the site Worker at
//    /api/scaduscope/tags (src/worker/index.js), backed by D1, plus everyone's
//    recently tagged names from /api/scaduscope/names
//
// The Worker decides the points from Bull Valley's real clock, so the ?at=
// preview can't fake the bonus. If the Worker can't be reached (the Eleventy
// dev server has no /api, or D1 is down), tags still score locally from the
// real clock and the shared total reads as offline.

import { generateName } from './names.js'

const ENDPOINT = '/api/scaduscope/tags'
const NAMES_ENDPOINT = '/api/scaduscope/names'
const STORAGE_KEY = 'bull-valley-scaduscope:v1:tagged'
const POLL_MS = 30000

function readAllTime() {
  try {
    const n = Number(localStorage.getItem(STORAGE_KEY))
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
  } catch (err) {
    return 0
  }
}

function writeAllTime(n) {
  try {
    localStorage.setItem(STORAGE_KEY, String(n))
  } catch (err) {
    /* storage unavailable — all-time just won't persist */
  }
}

// isWitchingNow(): true during 03:00–03:59 by Bull Valley's real clock.
// onChange(state) fires whenever a number changes.
export function createTally({ isWitchingNow, onChange }) {
  const state = {
    visit: 0,
    allTime: readAllTime(),
    everyone: null, // { tags, points } once known
    recent: null, // everyone's recently tagged names, once known
    // Did the last attempt to read everyone's names succeed? null until the
    // first attempt. Lets the readout tell "nobody has tagged anything" apart
    // from "the shared record can't be reached".
    recentOk: null,
    online: false,
  }
  const emit = () => onChange({ ...state, bonus: isWitchingNow() })

  // Everyone's field log: [{ name, tags, lastTaggedAt }], newest first. A
  // failure keeps the last good list rather than blanking it.
  async function refreshRecent() {
    try {
      const res = await fetch(NAMES_ENDPOINT, {
        headers: { accept: 'application/json' },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body = await res.json()
      if (!Array.isArray(body.names)) throw new Error('bad names payload')
      state.recent = body.names
      state.recentOk = true
    } catch (err) {
      console.warn('[scaduscope] shared name log unavailable:', err)
      state.recentOk = false
    }
  }

  function score(points) {
    state.visit += points
    state.allTime += points
    writeAllTime(state.allTime)
    emit()
  }

  async function refresh() {
    try {
      const res = await fetch(ENDPOINT, {
        headers: { accept: 'application/json' },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body = await res.json()
      if (typeof body.tags !== 'number') throw new Error('bad tally payload')
      state.everyone = body
      state.online = true
      await refreshRecent()
    } catch (err) {
      state.online = false
      // The names come from the same Worker and database; if the total can't
      // be read, the log can't either.
      state.recentOk = false
    }
    emit()
  }

  // One tag. The server awards the points and names the shadowman, keeping
  // the name forever; offline, score from the real clock and name it locally
  // (unrecorded). Resolves { name, timesTagged, recorded }.
  async function tag() {
    try {
      const res = await fetch(ENDPOINT, { method: 'POST' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body = await res.json()
      state.everyone = body.total
      state.online = true
      score(body.points)
      // The new name should appear in everyone's log straight away.
      refreshRecent().then(emit)
      return { name: body.name, timesTagged: body.timesTagged, recorded: true }
    } catch (err) {
      console.warn('[scaduscope] tag not recorded on the shared tally:', err)
      state.online = false
      score(isWitchingNow() ? 2 : 1)
      return { name: generateName(), timesTagged: 0, recorded: false }
    }
  }

  refresh()
  setInterval(refresh, POLL_MS)
  emit()
  return { tag }
}
