// BULL VALLEY SCADUSCOPE background loop. Forked from MAPLE LEAF RAG ZONE's
// audio.js (src/assets/js/maple-leaf-rag/audio.js) with this page's element
// ids and storage key; behavior is unchanged: plays from the top, fades in,
// loops, pauses with the tab, and waits for a user gesture (the gate's buttons)
// before making any sound. No-ops when the page inlines no audio URL.

const STORAGE_KEY = 'bull-valley-scaduscope:v1:audio'
const TARGET_VOLUME = 0.6
const FADE_IN_MS = 4000
const RESUME_FADE_MS = 800

function readConfig() {
  const el = document.getElementById('bvs-audio')
  if (!el) return null
  try {
    const parsed = JSON.parse(el.textContent || 'null')
    return parsed && typeof parsed.src === 'string' ? parsed : null
  } catch (err) {
    console.warn('[scaduscope] audio config parse failed:', err)
    return null
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
  if (!config) return null

  const toggle = document.getElementById('bvs-audio-toggle')
  if (toggle) toggle.hidden = false

  const audio = new Audio(config.src)
  audio.preload = 'metadata'
  audio.loop = true
  audio.volume = 0

  let enabled = false
  let started = false
  let pausedByVisibility = false
  let fadeRaf = 0

  function fade(to, ms) {
    cancelAnimationFrame(fadeRaf)
    const from = audio.volume
    const startedAt = performance.now()
    const step = (now) => {
      // rAF's timestamp can predate startedAt by a frame, making t negative;
      // volume outside 0..1 throws, which would kill the fade silently.
      const t = ms <= 0 ? 1 : Math.min(1, Math.max(0, (now - startedAt) / ms))
      audio.volume = Math.min(1, Math.max(0, from + (to - from) * t))
      if (t < 1) fadeRaf = requestAnimationFrame(step)
    }
    fadeRaf = requestAnimationFrame(step)
  }

  function start(fadeMs) {
    audio
      .play()
      .then(() => {
        started = true
        fade(TARGET_VOLUME, fadeMs)
      })
      .catch((err) => console.warn('[scaduscope] audio play blocked:', err))
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
      start(FADE_IN_MS)
    } else {
      cancelAnimationFrame(fadeRaf)
      audio.pause()
    }
  }

  if (toggle) toggle.addEventListener('click', () => setEnabled(!enabled))

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
  return {
    setEnabled,
    // Playback position in seconds while the loop is audibly playing, else
    // null. The radar's beat clock locks to it.
    position() {
      return started && enabled && !audio.paused ? audio.currentTime : null
    },
  }
}
