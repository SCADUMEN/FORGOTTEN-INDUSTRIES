// BULL VALLEY SCADUSCOPE entry point: a psychogeographic map of Bull Valley,
// Illinois, and the shadowmen who move through it. Boot, clock, render loop,
// and lifecycle follow MAPLE LEAF RAG ZONE's main.js
// (src/assets/js/maple-leaf-rag/main.js).
//
// Real: the terrain, roads, water, reserves, graveyards, gas stations, IDOT
// traffic counts (all baked by scripts/fetch_bull_valley.cjs), the sun and
// moon (astro.js), the live weather (weather.js), and Bull Valley's clock.
// Simulated: the hour-by-hour traffic flow. Fiction: the shadowmen.
//
// Preview: ?at=HH:MM starts the Bull Valley clock at that local time today
// (e.g. ?at=03:15 for the witching hour); the clock then runs normally.

import { createRenderer } from './gl.js'
import { rasterizeLayers, decodeTerrain } from './layers.js'
import {
  sunPosition,
  moonPosition,
  moonIllumination,
  darknessFromSun,
} from './astro.js'
import { watchWeather } from './weather.js'
import { targetHerds, gloomFromWeather, witching } from './density.js'
import { createHerds } from './herds.js'
import { createOverlay } from './overlay.js'
import { busiest, hourShare, HOURLY_SHARE } from './traffic.js'
import { createHud } from './hud.js'
import { createIntro, writeHigh, describeHigh, HIGH_LABELS } from './intro.js'
import { createAudio } from './audio.js'
import {
  sweepAngle,
  behind,
  echo,
  pulse,
  createBeatClock,
  pulseTint,
  AUDIO_LEAD_SECONDS,
} from './radar.js'
import { animateTitle } from './title.js'
import { readUnits, writeUnits, ringKm } from './units.js'

const LAT = 42.3206
const LON = -88.3551
const ZONE = 'America/Chicago'
const IDLE_MS = 4000

const canvas = document.getElementById('bvs-canvas')
const overlayCanvas = document.getElementById('bvs-overlay')
const dial = document.getElementById('bvs-dial')
const dialValue = document.getElementById('bvs-dial-value')
const hudToggle = document.getElementById('bvs-hud-toggle')
const unitsToggle = document.getElementById('bvs-units-toggle')

const clockFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: ZONE,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
  timeZoneName: 'short',
})

const grainSeed = Math.random() * 1000
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

let renderer = null
let overlay = null
let herds = null
let hud = null
let geo = null
let terrainImage = null
let weather = { reading: null, error: null }
let high = 0
let showHud = true
let units = readUnits()
let rafId = 0
let cssW = 0
let cssH = 0
let renderScale = 1
let quality = 'high'
let lastFrameAt = 0
let lastHudAt = -1
let redrawStill = null // set under prefers-reduced-motion: resettle + redraw
let redrawFrame = null // set under prefers-reduced-motion: redraw only
let pointer = null // CSS px of a hovering mouse/pen, for the herd tooltip
let audioSource = null // the loop, when the page has one (see audio.js)
const beatClock = createBeatClock()
let hudRect = null // readout box bounds (CSS px), refreshed with the readout
const frameDeltas = []

// Pause-corrected animation clock (seconds) so motion never jumps after a
// backgrounded tab. Wall-clock time for the sky is separate (skyDate).
let pausedTotal = 0
let pauseStart = null
const getTime = () => (performance.now() - pausedTotal) / 1000

const clockOffsetMs = previewOffset()
const skyDate = () => new Date(Date.now() + clockOffsetMs)

boot()

async function boot() {
  // Tab title: emoji plus a scrolling sine wave that swells with the dial.
  animateTitle(() => high, { reduced })
  const audio = createAudio()
  audioSource = audio
  const ready = loadData()

  createIntro({
    hasAudio: Boolean(audio),
    onChoose: async (choice) => {
      if (audio) audio.setEnabled(choice.wantsSound)
      setHigh(choice.high)
      try {
        await ready
      } catch (err) {
        console.error('[scaduscope] data load failed:', err)
        showFallback('The survey data did not load. The map cannot resolve.')
        return
      }
      start()
    },
  })
}

async function loadData() {
  const config = JSON.parse(document.getElementById('bvs-config').textContent)
  const [geoRes, image] = await Promise.all([
    fetch(config.geo),
    loadImage(config.terrain),
  ])
  if (!geoRes.ok) throw new Error(`geo.json HTTP ${geoRes.status}`)
  geo = await geoRes.json()
  terrainImage = image
}

function loadImage(src) {
  const img = new Image()
  img.decoding = 'async'
  img.src = src
  return img.decode().then(() => img)
}

function start() {
  renderer = createRenderer(canvas)
  if (!renderer) {
    showFallback('This instrument needs WebGL2. The map cannot resolve.')
    return
  }
  const layers = rasterizeLayers(geo)
  renderer.uploadTerrain(terrainImage)
  renderer.uploadLayers('layersA', layers.layersA, layers.size)
  renderer.uploadLayers('layersB', layers.layersB, layers.size)

  herds = createHerds({ geo, terrain: decodeTerrain(terrainImage) })
  overlay = createOverlay(overlayCanvas, geo)
  hud = createHud()
  document.body.classList.add('bvs-live')

  watchWeather((next) => {
    weather = next
    if (redrawStill) redrawStill()
  })
  wireControls()
  resizeAll()

  if (reduced) {
    // One still frame per minute: no motion, but the sky and census stay true.
    // Weather arriving or the dial moving redraws it immediately.
    redrawStill = () => {
      const s = sample()
      herds.herds.length = 0
      herds.settle(s.target, high)
      render(s, 0, 0)
    }
    redrawFrame = () => render(sample(), 0, 0)
    redrawStill()
    setInterval(redrawStill, 60000)
    return
  }

  wireLifecycle()
  lastFrameAt = getTime()
  rafId = requestAnimationFrame(frame)
}

// Everything the frame needs from the real world, right now.
function sample() {
  const now = skyDate()
  const local = bullValleyTime(now)
  const sun = sunPosition(now, LAT, LON)
  const moonPos = moonPosition(now, LAT, LON)
  const moon = moonIllumination(now)
  const dark = darknessFromSun(sun.altitude)
  const w = weather.reading
  const gloom = gloomFromWeather(w)
  const target = targetHerds({
    high,
    darkness: dark,
    hour: local.hour,
    moon: moon.fraction,
    gloom,
  })
  return { now, local, sun, moonPos, moon, dark, w, gloom, target }
}

function frame() {
  rafId = requestAnimationFrame(frame)
  const time = getTime()
  const dt = Math.min(0.1, time - lastFrameAt)
  render(sample(), time, dt)
  trackPerformance(time, dt)
  lastFrameAt = time
}

function render(s, time, dt) {
  const w = s.w
  const windTo = windVector(w)
  const h01 = high / 10

  // Under reduced motion the census is settled by redrawStill; stepping the
  // simulation on a still redraw would spawn or retire herds behind its back.
  if (!reduced) {
    herds.update({
      time,
      dt,
      high,
      dark: s.dark,
      target: s.target,
      windTo: [windTo[0] * 1.5, windTo[1] * 1.5],
    })
  }

  const rect = mapRect(time)
  const scale = canvas.width / cssW
  const code = w ? w.code : 0

  // Radar: centred on the map, reaching its corners. Under reduced motion the
  // sweep stops and every echo holds at full, so nothing is hidden.
  const radarOn = reduced ? 0 : 1
  // Sweep and pulse run on the beat clock, locked to the loop when it plays.
  const heard = audioSource ? audioSource.position() : null
  const beatTime = beatClock.now(
    time,
    heard == null ? null : heard - AUDIO_LEAD_SECONDS
  )
  const sweep = sweepAngle(beatTime)
  const rcx = rect.x + rect.w / 2
  const rcy = rect.y + rect.h / 2
  const radius = Math.hypot(rect.w, rect.h) / 2
  const pxPerKm = (rect.w / geo.metres.width) * 1000
  const echoAt = (x, y) =>
    radarOn ? echo(behind(sweep, Math.atan2(y - rcy, x - rcx)), h01) : 1
  renderer.draw({
    time,
    mapRect: [rect.x * scale, rect.y * scale, rect.w * scale, rect.h * scale],
    metres: [geo.metres.width, geo.metres.height],
    elev: [geo.terrain.min, geo.terrain.max],
    high: h01,
    dark: s.dark,
    sun: toVector(s.sun),
    moon: toVector(s.moonPos),
    moonLight: s.moonPos.altitude > 0 ? s.moon.fraction : 0,
    cloud: w ? w.cloudCover / 100 : 0.2,
    fog: code === 45 || code === 48 ? 1 : 0,
    wet: code >= 51 ? 1 : 0,
    wind: [
      (windTo[0] * 60) / geo.metres.width,
      (windTo[1] * 60) / geo.metres.height,
    ],
    traffic: hourShare(s.local.hour) / Math.max(...HOURLY_SHARE),
    witching: witching(s.local.hour),
    grainSeed,
    sweep,
    // Range rings every kilometre, or every mile.
    radar: [
      rcx * scale,
      rcy * scale,
      radius * scale,
      pxPerKm * ringKm(units) * scale,
    ],
    radarOn,
    pulse: radarOn ? pulse(beatTime) : 0,
    pulseTint: radarOn ? pulseTint(beatTime) : 0,
    // Auras glow with the herd's radar echo, so the map lights up in step
    // with the sweep; a faint floor keeps a trace between passes.
    herds: herds.herds.map((h) => [
      h.x,
      h.y,
      // A loner casts a smaller aura than a herd.
      (h.members.length === 1 ? 170 : 380) / geo.metres.width,
      h.fade *
        (0.12 + 0.88 * echoAt(rect.x + h.x * rect.w, rect.y + h.y * rect.h)),
    ]),
  })

  overlay.setRect(rect)
  overlay.draw({
    time,
    dt,
    hour: s.local.hour,
    high: h01,
    dark: s.dark,
    herds: herds.herds,
    showLabels: showHud,
    radar: { on: radarOn, sweep, cx: rcx, cy: rcy },
    pointer,
    units,
    // Labels skip anything that would land under the readout box.
    reserved: showHud && hudRect ? [hudRect] : [],
  })

  if (time - lastHudAt >= 0.5 || dt === 0) {
    lastHudAt = time
    const panel = document.getElementById('bvs-hud')
    const r = panel ? panel.getBoundingClientRect() : null
    hudRect =
      r && r.width ? { x0: r.left, x1: r.right, y0: r.top, y1: r.bottom } : null
    hud.update({
      clockText: s.local.text,
      zone: s.local.zone,
      sunAlt: s.sun.altitude,
      moon: s.moon,
      weather: w,
      weatherError: weather.error,
      busiest: busiest(geo.traffic, s.local.hour),
      high,
      census: herds.census(),
      units,
      elev: [geo.terrain.min, geo.terrain.max],
      witching: witching(s.local.hour) === 1,
    })
  }
}

// Direction toward a body as a unit vector in map space (x east, y south, z up).
// Azimuth is SunCalc's: from south, positive toward west.
function toVector({ altitude, azimuth }) {
  const c = Math.cos(altitude)
  return [-Math.sin(azimuth) * c, Math.cos(azimuth) * c, Math.sin(altitude)]
}

// Where the wind blows toward, metres/s in map space. Open-Meteo reports the
// direction the wind comes FROM, clockwise from north.
function windVector(w) {
  if (!w) return [0, 0]
  const to = ((w.windFrom + 180) * Math.PI) / 180
  const ms = w.windKmh / 3.6
  return [Math.sin(to) * ms, -Math.cos(to) * ms]
}

// The map's rectangle in CSS px: contained, centred, breathing very slightly.
// On narrow screens the readout would sit on top of the map, so the map is
// centred in the space below it instead (when the readout is showing).
function mapRect(time) {
  const aspect = geo.metres.width / geo.metres.height
  let top = 0
  if (cssW < 700 && showHud) {
    const panel = document.getElementById('bvs-hud')
    if (panel) top = panel.getBoundingClientRect().bottom + 8
  }
  const availH = cssH - top
  let h = availH * 0.9
  let w = h * aspect
  if (w > cssW * 0.94) {
    w = cssW * 0.94
    h = w / aspect
  }
  const zoom = reduced ? 1 : 1 + 0.02 * Math.sin(time * 0.05)
  w *= zoom
  h *= zoom
  return { x: (cssW - w) / 2, y: top + (availH - h) / 2, w, h }
}

// Bull Valley's wall clock, whatever the viewer's own time zone. The formatter
// (clockFormat) is declared at the top of the module, because previewOffset()
// reads the clock during module evaluation.
function bullValleyTime(date) {
  const parts = Object.fromEntries(
    clockFormat.formatToParts(date).map((p) => [p.type, p.value])
  )
  const hh = Number(parts.hour)
  const mm = Number(parts.minute)
  const ss = Number(parts.second)
  return {
    hour: hh + mm / 60 + ss / 3600,
    text: `${parts.hour}:${parts.minute}:${parts.second}`,
    zone: parts.timeZoneName,
  }
}

// ?at=HH:MM -> milliseconds to shift the clock so Bull Valley reads HH:MM now.
function previewOffset() {
  const at = new URLSearchParams(window.location.search).get('at')
  const match = at && /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(at)
  if (!match) return 0
  const target = Number(match[1]) + Number(match[2]) / 60
  const current = bullValleyTime(new Date()).hour
  let delta = target - current
  if (delta < 0) delta += 24
  return delta * 3600 * 1000
}

function setHigh(n) {
  high = n
  if (dial) {
    dial.value = String(n)
    dial.setAttribute('aria-valuetext', describeHigh(n))
  }
  if (dialValue) dialValue.textContent = `${n} · ${HIGH_LABELS[n]}`
}

function wireControls() {
  if (dial) {
    dial.addEventListener('input', () => {
      setHigh(Number(dial.value))
      writeHigh(high)
      if (redrawStill) redrawStill()
    })
  }

  // Units: the button names the current system; a click switches to the other.
  const applyUnits = () => {
    if (unitsToggle) {
      unitsToggle.textContent = units === 'metric' ? 'Metric' : 'Imperial'
      unitsToggle.setAttribute(
        'aria-label',
        `Units: ${units === 'metric' ? 'metric' : 'imperial'}. Switch to ${units === 'metric' ? 'imperial' : 'metric'}.`
      )
    }
  }
  if (unitsToggle) {
    unitsToggle.addEventListener('click', () => {
      units = units === 'metric' ? 'imperial' : 'metric'
      writeUnits(units)
      applyUnits()
      lastHudAt = -Infinity
      if (redrawFrame) redrawFrame()
    })
  }
  applyUnits()

  const applyHud = () => {
    document.body.classList.toggle('bvs-hud-hidden', !showHud)
    if (hudToggle) {
      hudToggle.setAttribute('aria-pressed', String(showHud))
      hudToggle.textContent = showHud ? 'Readout On' : 'Readout Off'
    }
  }
  if (hudToggle) {
    hudToggle.addEventListener('click', () => {
      showHud = !showHud
      applyHud()
    })
  }
  document.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLInputElement) return
    if (event.key === 'h' || event.key === 'H') {
      showHud = !showHud
      applyHud()
    }
  })
  applyHud()

  // Screensaver manners: after a few idle seconds, hide the cursor and fade
  // the chrome. Any pointer movement, key, or focus brings it back.
  let idleTimer = 0
  const wake = () => {
    document.body.classList.remove('bvs-idle')
    clearTimeout(idleTimer)
    idleTimer = setTimeout(() => {
      if (!document.activeElement?.closest('#bvs-chrome, #bvs-hud')) {
        document.body.classList.add('bvs-idle')
        pointer = null
        if (redrawFrame) redrawFrame()
      }
    }, IDLE_MS)
  }
  for (const type of ['pointermove', 'pointerdown', 'keydown', 'focusin']) {
    window.addEventListener(type, wake, { passive: true })
  }
  wake()

  // Herd tooltip: follow a mouse or pen; a tap on touch screens places it.
  const track = (event) => {
    pointer = { x: event.clientX, y: event.clientY }
    if (redrawFrame) redrawFrame()
  }
  window.addEventListener('pointermove', track, { passive: true })
  window.addEventListener('pointerdown', track, { passive: true })
  document.documentElement.addEventListener('pointerleave', () => {
    pointer = null
    if (redrawFrame) redrawFrame()
  })
}

function trackPerformance(time, dt) {
  frameDeltas.push(dt)
  if (frameDeltas.length < 60) return
  const median = frameDeltas.slice().sort((a, b) => a - b)[30]
  frameDeltas.length = 0
  if (median <= 0.022) return
  if (quality === 'high') {
    quality = 'low'
    renderer.setQuality('low')
  } else if (renderScale > 0.6) {
    renderScale = Math.max(0.6, renderScale * 0.8)
    resizeAll()
  }
}

function resizeAll() {
  cssW = window.innerWidth
  cssH = window.innerHeight
  const small = Math.min(cssW, cssH) < 700
  const dprCap = Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.5)
  renderer.resize(cssW, cssH, dprCap * renderScale)
  overlay.resize(cssW, cssH, Math.min(window.devicePixelRatio || 1, 2))
}

function wireLifecycle() {
  let resizeTimer = 0
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(resizeAll, 150)
  })

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId)
      pauseStart = performance.now()
    } else if (pauseStart !== null) {
      pausedTotal += performance.now() - pauseStart
      pauseStart = null
      lastFrameAt = getTime()
      frameDeltas.length = 0
      rafId = requestAnimationFrame(frame)
    }
  })

  let restoreTimer = 0
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault()
    cancelAnimationFrame(rafId)
    restoreTimer = setTimeout(
      () => showFallback('The display context was lost. Reload to resume.'),
      5000
    )
  })
  canvas.addEventListener('webglcontextrestored', () => {
    clearTimeout(restoreTimer)
    renderer = createRenderer(canvas)
    if (!renderer) {
      showFallback('This instrument needs WebGL2. The map cannot resolve.')
      return
    }
    const layers = rasterizeLayers(geo)
    renderer.uploadTerrain(terrainImage)
    renderer.uploadLayers('layersA', layers.layersA, layers.size)
    renderer.uploadLayers('layersB', layers.layersB, layers.size)
    renderer.setQuality(quality)
    resizeAll()
    lastFrameAt = getTime()
    rafId = requestAnimationFrame(frame)
  })
}

function showFallback(message) {
  canvas.style.display = 'none'
  overlayCanvas.style.display = 'none'
  const note = document.getElementById('bvs-fallback')
  if (note) {
    note.textContent = message
    note.hidden = false
  }
}
