// ZOOT background audio: the FORGOTTEN INDUSTRIES mixtape (DJ STUXNET) looping
// under the slick. The file URL is inlined by the page as #zoot-audio JSON
// (see src/zoot.njk / src/_data/zootMixtape.js, sourced from the discography).
//
// Behavior:
//  - enters the mix at a random point, fades in, loops forever
//  - browsers block autoplay-with-sound until a user gesture; the ignition
//    modal's button (see intro.js) supplies that gesture and calls setEnabled
//  - the "Sound On / Off" toggle in the chrome flips it afterward; the choice
//    persists in localStorage
//  - pauses with the tab (mirrors the render loop) and resumes on return
//
// createAudio() does not start playback on its own — it exposes setEnabled(bool)
// for the modal and the toggle to drive.
//
// Plain <audio> element (not Web Audio): fade is a .volume ramp, so no
// crossorigin / CORS is needed. Random seek relies on the host serving byte
// ranges — assets.the-rn.info does (verified 206 Partial Content).

const STORAGE_KEY = 'zoot:v1:audio'
const TARGET_VOLUME = 0.6
const FADE_IN_MS = 4000
const RESUME_FADE_MS = 800

// URL inlined by the page. Returns { src } or null (feature then no-ops).
function readConfig() {
  const el = document.getElementById('zoot-audio')
  if (!el) return null
  try {
    const parsed = JSON.parse(el.textContent || 'null')
    return parsed && typeof parsed.src === 'string' ? parsed : null
  } catch (err) {
    console.warn('[zoot] audio config parse failed:', err)
    return null
  }
}

// User preference. Default on; only an explicit stored "off" silences it.
function readPref() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch (err) {
    return true
  }
}

function writePref(on) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off')
  } catch (err) {
    /* private mode / storage disabled — preference just won't persist */
  }
}

export function createAudio() {
  const config = readConfig()
  if (!config) return

  const toggle = document.getElementById('zoot-audio-toggle')

  const audio = new Audio(config.src)
  audio.preload = 'metadata'
  audio.loop = true
  audio.volume = 0

  let enabled = readPref() // does the visitor want sound?
  let started = false // has playback been kicked off at least once?
  let pausedByVisibility = false
  let fadeRaf = 0

  // Enter the mix at a random point, once, as soon as the duration is known.
  let seeked = false
  audio.addEventListener('loadedmetadata', () => {
    if (seeked) return
    const d = audio.duration
    if (Number.isFinite(d) && d > 0) {
      audio.currentTime = Math.random() * d * 0.9
      seeked = true
    }
  })

  function fade(to, ms) {
    cancelAnimationFrame(fadeRaf)
    const from = audio.volume
    const startedAt = performance.now()
    const step = (now) => {
      const t = ms <= 0 ? 1 : Math.min(1, (now - startedAt) / ms)
      audio.volume = from + (to - from) * t
      if (t < 1) fadeRaf = requestAnimationFrame(step)
    }
    fadeRaf = requestAnimationFrame(step)
  }

  // Start playback and fade up. Always invoked from a user gesture (modal
  // button or chrome toggle), so autoplay is permitted.
  function start(fadeMs) {
    const promise = audio.play()
    if (promise && typeof promise.then === 'function') {
      promise
        .then(() => {
          started = true
          fade(TARGET_VOLUME, fadeMs)
        })
        .catch((err) => console.warn('[zoot] audio play blocked:', err))
    } else {
      started = true
      fade(TARGET_VOLUME, fadeMs)
    }
  }

  function syncToggle() {
    if (!toggle) return
    toggle.setAttribute('aria-pressed', String(enabled))
    toggle.textContent = enabled ? 'Sound On' : 'Sound Off'
  }

  function setEnabled(next) {
    enabled = next
    writePref(enabled)
    syncToggle()
    if (enabled) {
      start(FADE_IN_MS) // invoked from a click, so autoplay is permitted
    } else {
      cancelAnimationFrame(fadeRaf)
      audio.pause()
    }
  }

  if (toggle) {
    toggle.addEventListener('click', () => setEnabled(!enabled))
  }

  // Pause with the tab and resume on return, but never override an explicit
  // "off" — and never auto-start sound before the first gesture.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (started && !audio.paused) {
        pausedByVisibility = true
        cancelAnimationFrame(fadeRaf)
        audio.pause()
      }
    } else if (pausedByVisibility) {
      pausedByVisibility = false
      if (enabled) {
        audio
          .play()
          .then(() => fade(TARGET_VOLUME, RESUME_FADE_MS))
          .catch(() => {})
      }
    }
  })

  syncToggle()

  // Driven by the ignition modal (intro.js) and, afterwards, the chrome toggle.
  return { setEnabled }
}
