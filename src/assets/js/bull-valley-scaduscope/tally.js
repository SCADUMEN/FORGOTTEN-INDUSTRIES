// BULL VALLEY SCADUSCOPE tally: the light game layer. Clicking a shadowman
// tags it (once per visit); each tag scores 1, or 2 during the witching hour.
//
// Three numbers:
//  - this visit: resets on reload
//  - all time: yours, kept in this browser's localStorage
//  - everyone: the shared total across all visitors, from the site Worker at
//    /api/scaduscope/tags (src/worker/index.js), backed by D1
//
// The Worker decides the points from Bull Valley's real clock, so the ?at=
// preview can't fake the bonus. If the Worker can't be reached (the Eleventy
// dev server has no /api, or D1 is down), tags still score locally from the
// real clock and the shared total reads as offline.

const ENDPOINT = '/api/scaduscope/tags'
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
    online: false,
  }
  const emit = () => onChange({ ...state, bonus: isWitchingNow() })

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
    } catch (err) {
      state.online = false
    }
    emit()
  }

  // One tag: the server awards the points; offline, score from the real clock.
  async function tag() {
    try {
      const res = await fetch(ENDPOINT, { method: 'POST' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body = await res.json()
      state.everyone = body.total
      state.online = true
      score(body.points)
    } catch (err) {
      console.warn('[scaduscope] tag not recorded on the shared tally:', err)
      state.online = false
      score(isWitchingNow() ? 2 : 1)
    }
  }

  refresh()
  setInterval(refresh, POLL_MS)
  emit()
  return { tag }
}
