// MAPLE LEAF RAG ZONE entry point: capability checks, boot, render loop, lifecycle.
// Forked from ZOOT's main.js (src/assets/js/zoot/main.js), with the entire
// text-fragment system and all pointer interaction removed — this zone is a
// passive, image-only slick. The photo scheduler is shared with ZOOT verbatim.

import { createRenderer } from './gl.js'
import { createPhotos } from '../zoot/photos.js'
import { createAudio } from './audio.js'
import { createIntro } from './intro.js'

const canvas = document.getElementById('mlr-canvas')

// Passive slick constants. In ZOOT these were driven by pointer interaction;
// here the field churns on uTime alone. Values match ZOOT's resting look.
const THICKNESS = 1.1
const PHASE = 2.0
const DRIFT = [0.6, 0.3]

// Pause-corrected clock so uTime never jumps after a backgrounded tab.
let pausedTotal = 0
let pauseStart = null
const getTime = () => (performance.now() - pausedTotal) / 1000

let renderer = null
let photos = null
let rafId = 0
let cssW = 0
let cssH = 0
let renderScale = 1
let quality = 'high'

const grainSeed = Math.random() * 1000

const frameDeltas = []
let lastFrameAt = 0

boot()

async function boot() {
  // Background rag + its ignition modal — wired before any capability branch so
  // they work in the normal, reduced-motion, and no-WebGL fallback views alike.
  // Both no-op when the page did not inline an audio URL. The modal button
  // supplies the gesture browsers require, then drives setEnabled.
  const audio = createAudio()
  if (audio)
    createIntro({ onChoose: (wantsSound) => audio.setEnabled(wantsSound) })

  renderer = createRenderer(canvas)
  if (!renderer) {
    showFallback()
    return
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) {
    await staticResolution()
    return
  }

  resizeAll()
  const manifest = readManifest()
  photos = createPhotos({
    base: manifest.photos,
    overlay: [],
    renderer,
    getAspect: () => cssW / cssH,
  })
  wireLifecycle()
  lastFrameAt = getTime()
  rafId = requestAnimationFrame(frame)
}

// Background-photo manifest inlined by the page as JSON (see
// src/maple-leaf-rag.njk): { photos }, an array of { src }. The Shadow Zone
// ephemera feed the single base layer. Missing/malformed -> empty.
function readManifest() {
  const el = document.getElementById('mlr-photos')
  if (!el) return { photos: [] }
  try {
    const parsed = JSON.parse(el.textContent || '{}')
    return { photos: Array.isArray(parsed.photos) ? parsed.photos : [] }
  } catch (err) {
    console.warn('[maple-leaf-rag] photo manifest parse failed:', err)
    return { photos: [] }
  }
}

function frame() {
  rafId = requestAnimationFrame(frame)
  const time = getTime()

  renderer.draw({
    time,
    thickness: THICKNESS,
    phase: PHASE,
    drift: DRIFT,
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
    restoreTimer = setTimeout(showFallback, 5000)
  })
  canvas.addEventListener('webglcontextrestored', () => {
    clearTimeout(restoreTimer)
    renderer = createRenderer(canvas)
    if (!renderer) {
      showFallback()
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

// prefers-reduced-motion: one frozen iridescent frame, no animation loop.
async function staticResolution() {
  cssW = window.innerWidth
  cssH = window.innerHeight
  const dprCap = Math.min(window.devicePixelRatio || 1, 1.5)
  renderer.resize(cssW, cssH, dprCap)
  const photo = await staticPhoto()
  renderer.draw({
    time: 47.3,
    thickness: THICKNESS,
    phase: PHASE,
    drift: [0.7, 0.4],
    grainSeed,
    photo,
  })
}

// One frozen photograph for the reduced-motion frame (no cross-fade loop).
async function staticPhoto() {
  const { photos: list } = readManifest()
  if (!list.length) return null
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = list[0].src
    await img.decode()
    renderer.uploadPhoto(0, img)
    const view = cssW / cssH
    const aspect = img.naturalWidth / img.naturalHeight
    const scaleA = [Math.max(1, aspect / view), Math.max(1, view / aspect)]
    return {
      mix: 0,
      amount: 1.1,
      scaleA,
      scaleB: [1, 1],
      mix2: 0,
      amount2: 0,
      scaleC: [1, 1],
      scaleD: [1, 1],
    }
  } catch (err) {
    console.warn('[maple-leaf-rag] static photo load failed:', err)
    return null
  }
}

// No canvas, no WebGL: hide the surface. There is no text fallback in this zone.
function showFallback() {
  canvas.style.display = 'none'
}
