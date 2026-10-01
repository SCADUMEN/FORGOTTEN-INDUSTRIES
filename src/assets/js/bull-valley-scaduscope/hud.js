// BULL VALLEY SCADUSCOPE readout: the instrument panel. Every value here is
// either measured (clock, sun, moon, weather, IDOT counts, terrain) or marked
// as simulated/estimated; the shadowmen census is the one fictional line.
// Text only changes twice a second, so the panel is not a live region; only
// the field log announces new entries.

import { phaseName, sunLabel } from './astro.js'
import { describeCode } from './weather.js'
import {
  temperature,
  windSpeed,
  elevation,
  elevationUnit,
  contourLabel,
} from './units.js'
import { entryNote, MAX_ENTRIES } from './log.js'

const DEG = 180 / Math.PI
const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

export function createHud() {
  const el = (id) => document.getElementById(id)
  const fields = {
    clock: el('bvs-hud-clock'),
    sun: el('bvs-hud-sun'),
    moon: el('bvs-hud-moon'),
    weather: el('bvs-hud-weather'),
    traffic: el('bvs-hud-traffic'),
    terrain: el('bvs-hud-terrain'),
    census: el('bvs-hud-census'),
    score: el('bvs-hud-score'),
    everyone: el('bvs-hud-everyone'),
    witching: el('bvs-hud-witching'),
  }
  const moonCanvas = el('bvs-hud-moon-glyph')
  const moonCtx = moonCanvas ? moonCanvas.getContext('2d') : null
  let lastPhase = -1

  function set(key, text) {
    const node = fields[key]
    if (node && node.textContent !== text) node.textContent = text
  }

  // Terminator drawn from the phase: lit limb on the right while waxing.
  function drawMoon(phase, fraction) {
    if (!moonCtx || Math.abs(phase - lastPhase) < 0.002) return
    lastPhase = phase
    const s = moonCanvas.width
    const r = s / 2 - 1
    moonCtx.clearRect(0, 0, s, s)
    moonCtx.save()
    moonCtx.translate(s / 2, s / 2)
    moonCtx.fillStyle = '#1e293b'
    moonCtx.beginPath()
    moonCtx.arc(0, 0, r, 0, Math.PI * 2)
    moonCtx.fill()
    moonCtx.fillStyle = '#f7f4ef'
    const waxing = phase < 0.5
    const k = 1 - 2 * fraction // terminator ellipse x-radius, -1..1
    moonCtx.beginPath()
    moonCtx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, !waxing)
    moonCtx.ellipse(
      0,
      0,
      Math.abs(k) * r,
      r,
      0,
      Math.PI / 2,
      -Math.PI / 2,
      k > 0 === waxing
    )
    moonCtx.fill()
    moonCtx.restore()
  }

  // s: { clockText, zone, sunAlt, moon, weather, weatherError, busiest, high,
  //      census: { figures, alone, groups }, witching, units, elev: [min, max] }
  function update(s) {
    const u = s.units
    set('clock', `${s.clockText} ${s.zone}`)
    set('sun', `${(s.sunAlt * DEG).toFixed(1)}° · ${sunLabel(s.sunAlt)}`)
    set(
      'moon',
      `${phaseName(s.moon.phase)} · ${Math.round(s.moon.fraction * 100)}% Lit`
    )
    drawMoon(s.moon.phase, s.moon.fraction)

    if (s.weather) {
      const w = s.weather
      const from = COMPASS[Math.round(w.windFrom / 45) % 8]
      set(
        'weather',
        `${temperature(w.tempC, u)} · ${describeCode(w.code)} · Cloud ${w.cloudCover}% · Wind ${windSpeed(w.windKmh, u)} from ${from}` +
          (s.weatherError ? ' · Stale' : '')
      )
    } else {
      set('weather', s.weatherError ? 'No Signal' : 'Acquiring…')
    }

    set(
      'traffic',
      s.busiest
        ? `${s.busiest.name} ≈ ${s.busiest.perHour.toLocaleString('en-US')} veh/h (Est., IDOT ${s.busiest.year})`
        : '—'
    )
    set(
      'terrain',
      `${elevation(s.elev[0], u)}–${elevation(s.elev[1], u)} ${elevationUnit(u)} · ${contourLabel(u)}`
    )
    const c = s.census
    set(
      'census',
      `${c.figures} ${c.figures === 1 ? 'Shadowman' : 'Shadowmen'} · ${c.alone} Alone · ${c.groups} ${c.groups === 1 ? 'Herd' : 'Herds'}`
    )
    if (fields.witching) fields.witching.hidden = !s.witching
  }

  // The game layer, driven by tally.js whenever a number changes.
  // t: { visit, allTime, everyone: { tags, points } | null, online, bonus }
  function updateTally(t) {
    const n = (v) => v.toLocaleString('en-US')
    set(
      'score',
      t.visit === 0 && t.allTime === 0
        ? `0 · Click a Shadowman${t.bonus ? ' · ×2 Now' : ''}`
        : `${n(t.visit)} · ${n(t.allTime)} All Time${t.bonus ? ' · ×2 Now' : ''}`
    )
    set(
      'everyone',
      t.online && t.everyone
        ? `${n(t.everyone.points)} pts · ${n(t.everyone.tags)} Tagged`
        : 'Offline'
    )
  }

  // Field log. Rows are plain text (names come from the Worker, but are never
  // parsed as HTML). New entries are prepended one at a time so the polite
  // live region announces only the new name, not the whole list.
  const logList = el('bvs-log-list')
  const logEmpty = el('bvs-log-empty')

  function logRow(entry) {
    const li = document.createElement('li')
    const time = document.createElement('span')
    time.className = 'bvs-log-time'
    time.textContent = entry.local
    const body = document.createElement('span')
    const note = document.createElement('span')
    note.className = 'bvs-log-note'
    note.textContent = ` · ${entryNote(entry)}`
    body.append(entry.name, note)
    li.append(time, body)
    return li
  }

  function renderLog(log) {
    if (!logList) return
    logList.replaceChildren(...log.map(logRow))
    if (logEmpty) logEmpty.hidden = log.length > 0
  }

  function addLogEntry(entry) {
    if (!logList) return
    logList.prepend(logRow(entry))
    while (logList.children.length > MAX_ENTRIES) logList.lastChild.remove()
    logList.scrollTop = 0
    if (logEmpty) logEmpty.hidden = true
  }

  // Yours / Everyone toggle.
  const tabs = Array.from(document.querySelectorAll('[data-bvs-log]'))
  const panels = Array.from(document.querySelectorAll('[data-bvs-log-panel]'))
  for (const tab of tabs) {
    tab.addEventListener('click', () => {
      for (const t of tabs) t.setAttribute('aria-pressed', String(t === tab))
      for (const p of panels)
        p.hidden = p.dataset.bvsLogPanel !== tab.dataset.bvsLog
    })
  }

  // Everyone's log: re-rendered only when the list actually changes. It is
  // not a live region, so the refresh every 30 s is never read aloud.
  const everyoneList = el('bvs-log-everyone')
  const everyoneEmpty = el('bvs-log-everyone-empty')
  let everyoneKey = ''

  // Bull Valley time for today's tags; a short date for older ones.
  const bvTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
  const bvDate = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    month: 'short',
    day: 'numeric',
  })
  const when = (ms) =>
    Date.now() - ms < 20 * 3600 * 1000 ? bvTime.format(ms) : bvDate.format(ms)

  // The status line under Everyone. An empty list only means "nobody has
  // tagged anything" when the list actually loaded; when the shared record
  // can't be reached it says so, instead of looking empty.
  function everyoneStatus(recent, ok) {
    const count = Array.isArray(recent) ? recent.length : 0
    if (ok === false) {
      return count
        ? 'Shared log offline · last known names'
        : 'Shared log offline. Your tags are kept in your own log for now.'
    }
    if (ok === null || ok === undefined) return 'Checking the shared log…'
    return count ? '' : 'No names yet from anyone.'
  }

  function renderEveryone(recent, ok) {
    if (everyoneEmpty) {
      const status = everyoneStatus(recent, ok)
      if (everyoneEmpty.textContent !== status)
        everyoneEmpty.textContent = status
      everyoneEmpty.hidden = status === ''
    }
    if (!everyoneList || !Array.isArray(recent)) return
    const key = JSON.stringify(recent)
    if (key === everyoneKey) return
    everyoneKey = key
    everyoneList.replaceChildren(
      ...recent.map((r) =>
        logRow({
          name: r.name,
          timesTagged: r.tags,
          recorded: true,
          local: when(r.lastTaggedAt),
        })
      )
    )
  }

  return {
    update,
    updateTally(t) {
      updateTally(t)
      renderEveryone(t.recent, t.recentOk)
    },
    renderLog,
    addLogEntry,
  }
}
