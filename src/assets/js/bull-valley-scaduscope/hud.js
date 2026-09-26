// BULL VALLEY SCADUSCOPE readout: the instrument panel. Every value here is
// either measured (clock, sun, moon, weather, IDOT counts, terrain) or marked
// as simulated/estimated; the shadowmen census is the one fictional line.
// Text only changes twice a second, so the panel is not a live region.

import { phaseName, sunLabel } from './astro.js'
import { describeCode } from './weather.js'
import {
  temperature,
  windSpeed,
  elevation,
  elevationUnit,
  contourLabel,
} from './units.js'

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

  return { update, updateTally }
}
