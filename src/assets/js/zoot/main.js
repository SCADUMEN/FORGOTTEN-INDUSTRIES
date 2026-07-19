// ZOOT entry point: capability checks, boot, render loop, lifecycle.

import {
  loadFragmentPool,
  createPicker,
  FragmentSlots,
  KIND_TINT,
} from './fragments.js'
import { createRenderer, MAX_FRAGS } from './gl.js'
import { createInteraction, renderPanel } from './interact.js'
import { createPhotos } from './photos.js'

const FALLBACK_HEADING =
  'ATLAS REPORT — the slick will not resolve on this instrument. The records remain.'
const STATIC_HEADING =
  'ZOOT / STATIC RESOLUTION — motion suppressed per instrument settings.'

const canvas = document.getElementById('zoot-canvas')
const focusCard = document.getElementById('zoot-focus')
const fallbackPanel = document.getElementById('zoot-fallback')

// Pause-corrected clock so uTime never jumps after a backgrounded tab.
let pausedTotal = 0
let pauseStart = null
const getTime = () => (performance.now() - pausedTotal) / 1000

let renderer = null
let slots = null
let interaction = null
let photos = null
let rafId = 0
let cssW = 0
let cssH = 0
let renderScale = 1
let quality = 'high'
let pool = null

const fragRects = new Float32Array(MAX_FRAGS * 4)
const fragReveals = new Float32Array(MAX_FRAGS)
const fragTints = new Float32Array(MAX_FRAGS * 3)
const grainSeed = Math.random() * 1000

const frameDeltas = []
let lastFrameAt = 0

boot()

async function boot() {
  const poolPromise = loadFragmentPool().catch((err) => {
    console.error('[zoot] data load failed:', err)
    return null
  })
  const fontsPromise = Promise.all([
    document.fonts.load("400 16px 'Space Mono'"),
    document.fonts.ready,
  ]).catch(() => {})

  renderer = createRenderer(canvas)
  if (!renderer) {
    showFallback(await poolPromise)
    return
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) {
    await staticResolution(poolPromise)
    return
  }

  pool = await poolPromise
  await fontsPromise
  if (!pool) {
    showFallback(null)
    return
  }

  const small = Math.min(window.innerWidth, window.innerHeight) < 700
  slots = new FragmentSlots(createPicker(pool), small ? 4 : MAX_FRAGS)
  interaction = createInteraction({
    canvas,
    slots,
    focusCard,
    getTime,
    metrics: () => ({
      cssW,
      cssH,
      aspect: cssW / cssH,
      sheetW: slots.canvas.width,
      sheetH: slots.canvas.height,
    }),
  })

  resizeAll()
  photos = createPhotos({
    manifest: readManifest(),
    renderer,
    getAspect: () => cssW / cssH,
  })
  wireLifecycle()
  lastFrameAt = getTime()
  rafId = requestAnimationFrame(frame)
}

// Background-photo manifest inlined by the page as JSON (see src/zoot.njk).
function readManifest() {
  const el = document.getElementById('zoot-photos')
  if (!el) return []
  try {
    const parsed = JSON.parse(el.textContent || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.warn('[zoot] photo manifest parse failed:', err)
    return []
  }
}

function frame() {
  rafId = requestAnimationFrame(frame)
  const time = getTime()

  slots.update(time)
  if (slots.dirty) {
    renderer.uploadTextSheet(slots.canvas)
    slots.dirty = false
  }

  fragReveals.fill(0)
  slots.slots.forEach((slot, i) => {
    if (!slot.rect || !slot.fragment) return
    fragRects.set(slots.rectUV(slot), i * 4)
    fragReveals[i] = slot.reveal
    fragTints.set(KIND_TINT[slot.fragment.kind], i * 3)
  })

  interaction.update(time)
  const s = interaction.state
  renderer.draw({
    time,
    impulses: s.impulses,
    fragRects,
    fragReveals,
    fragTints,
    focusIndex: s.focusIndex,
    focusAmount: s.focusAmount,
    thickness: s.thickness,
    phase: s.phase,
    drift: s.drift,
    grainSeed,
    photo: photos.update(time),
  })

  trackPerformance(time)
}

// One-way adaptive degrade: drop to the 3-octave program first, then shrink
// the drawing buffer (floor 0.6×). CSS size never changes.
function trackPerformance(time) {
  frameDeltas.push(time - lastFrameAt)
  lastFrameAt = time
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
  slots.resize(canvas.width, canvas.height)
  renderer.uploadTextSheet(slots.canvas)
  slots.dirty = false
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
    restoreTimer = setTimeout(() => showFallback(pool), 5000)
  })
  canvas.addEventListener('webglcontextrestored', () => {
    clearTimeout(restoreTimer)
    renderer = createRenderer(canvas)
    if (!renderer) {
      showFallback(pool)
      return
    }
    renderer.setQuality(quality)
    resizeAll()
    if (photos) {
      photos.setRenderer(renderer)
      photos.reset()
    }
    lastFrameAt = getTime()
    rafId = requestAnimationFrame(frame)
  })
}

// prefers-reduced-motion: one frozen iridescent frame, then a readable list.
async function staticResolution(poolPromise) {
  cssW = window.innerWidth
  cssH = window.innerHeight
  const dprCap = Math.min(window.devicePixelRatio || 1, 1.5)
  renderer.resize(cssW, cssH, dprCap)
  const photo = await staticPhoto()
  renderer.draw({
    time: 47.3,
    impulses: new Float32Array(64),
    fragRects,
    fragReveals,
    fragTints,
    focusIndex: -1,
    focusAmount: 0,
    thickness: 1.1,
    phase: 2.0,
    drift: [0.7, 0.4],
    grainSeed,
    photo,
  })
  const staticPool = await poolPromise
  renderPanel(
    fallbackPanel,
    STATIC_HEADING,
    staticPool ? pickPanelFragments(staticPool, 16) : null
  )
}

// One frozen photograph for the reduced-motion frame (no cross-fade loop).
async function staticPhoto() {
  const manifest = readManifest()
  if (!manifest.length) return null
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = manifest[0].src
    await img.decode()
    renderer.uploadPhoto(0, img)
    const view = cssW / cssH
    const aspect = img.naturalWidth / img.naturalHeight
    const scaleA = [Math.max(1, aspect / view), Math.max(1, view / aspect)]
    return { mix: 0, amount: 1.1, scaleA, scaleB: [1, 1] }
  } catch (err) {
    console.warn('[zoot] static photo load failed:', err)
    return null
  }
}

function showFallback(loadedPool) {
  canvas.style.display = 'none'
  renderPanel(
    fallbackPanel,
    FALLBACK_HEADING,
    loadedPool ? pickPanelFragments(loadedPool, 16) : null
  )
}

// Weighted-random picks, unique per document.
function pickPanelFragments(fromPool, count) {
  const pick = createPicker(fromPool)
  const seen = new Set()
  const out = []
  let guard = 0
  while (out.length < count && guard++ < 200) {
    const fragment = pick()
    if (seen.has(fragment.docId)) continue
    seen.add(fragment.docId)
    out.push(fragment)
  }
  return out
}
