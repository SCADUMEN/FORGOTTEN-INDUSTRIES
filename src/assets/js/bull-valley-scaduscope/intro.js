// BULL VALLEY SCADUSCOPE gate: "How high are you?" Adapted from MAPLE LEAF
// RAG ZONE's intro.js (src/assets/js/maple-leaf-rag/intro.js). The slider sets
// the dial (0–10); the buttons double as the user gesture browsers require
// before audio may play. With no audio configured the sound buttons are
// replaced by a single "Engage" button.
//
// The modal ships hidden (no-JS visitors get the <noscript> line); this reveals
// it, traps focus, remembers the last dial setting, and calls
// onChoose({ high, wantsSound }).

const STORAGE_KEY = 'bull-valley-scaduscope:v1:high'

export const HIGH_LABELS = [
  'Stone Sober',
  'Barely',
  'A Little',
  'Lifted',
  'Buzzing',
  'High',
  'Pretty High',
  'Very High',
  'Extremely High',
  'Unmoored',
  'Zooted',
]

export function readHigh() {
  try {
    const n = Number(localStorage.getItem(STORAGE_KEY))
    return Number.isInteger(n) && n >= 0 && n <= 10 ? n : 0
  } catch (err) {
    return 0
  }
}

export function writeHigh(n) {
  try {
    localStorage.setItem(STORAGE_KEY, String(n))
  } catch (err) {
    /* storage unavailable — the dial just won't be remembered */
  }
}

export function describeHigh(n) {
  return `${n} of 10, ${HIGH_LABELS[n]}`
}

export function createIntro({ hasAudio, onChoose }) {
  const modal = document.getElementById('bvs-intro')
  if (!modal) return

  const slider = document.getElementById('bvs-intro-high')
  const readout = document.getElementById('bvs-intro-high-value')
  const soundButtons = Array.from(modal.querySelectorAll('[data-bvs-sound]'))
  const engage = modal.querySelector('[data-bvs-engage]')

  soundButtons.forEach((b) => (b.hidden = !hasAudio))
  if (engage) engage.hidden = hasAudio

  const sync = () => {
    const n = Number(slider.value)
    readout.textContent = `${n} · ${HIGH_LABELS[n]}`
    slider.setAttribute('aria-valuetext', describeHigh(n))
  }
  slider.value = String(readHigh())
  sync()
  slider.addEventListener('input', sync)

  const focusables = () =>
    [slider, ...soundButtons, engage].filter((el) => el && !el.hidden)

  const choose = (wantsSound) => {
    const high = Number(slider.value)
    writeHigh(high)
    modal.hidden = true
    document.removeEventListener('keydown', onKey, true)
    onChoose({ high, wantsSound })
  }

  // Escape engages silently; Tab is trapped inside the gate.
  function onKey(event) {
    if (event.key === 'Escape') {
      event.preventDefault()
      choose(false)
    } else if (event.key === 'Tab') {
      const list = focusables()
      const first = list[0]
      const last = list[list.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
  }

  soundButtons.forEach((b) =>
    b.addEventListener('click', () => choose(b.dataset.bvsSound === 'on'))
  )
  if (engage) engage.addEventListener('click', () => choose(false))
  document.addEventListener('keydown', onKey, true)

  modal.hidden = false
  slider.focus()
}
