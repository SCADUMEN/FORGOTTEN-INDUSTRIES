// BULL VALLEY SCADUSCOPE tab title: the emoji, then a short sine wave drawn in
// block characters that scrolls like a dream-wave. Eight characters in all, so
// it fits a tab without an ellipsis. The wave swells with the dial: a low ripple
// when sober, the full ▁ to █ range at 10.
//
// Browsers throttle timers in background tabs to about once a second, so the
// wave steps more slowly while the page is out of view; that's expected. Under
// prefers-reduced-motion the title stays still.

const PREFIX = '📡🌚'
const LEVELS = '▁▂▃▄▅▆▇█'
const WIDTH = 6
const FRAME_MS = 180

// One frame of the wave. `phase` scrolls it; `high01` (0..1) sets amplitude.
export function waveFrame(phase, high01) {
  const amp = 0.25 + 0.75 * high01 // fraction of the full block range
  let out = ''
  for (let i = 0; i < WIDTH; i++) {
    const s = Math.sin(phase + i * 0.9) * amp // -amp..amp
    const level = Math.round(((s + 1) / 2) * (LEVELS.length - 1))
    out += LEVELS[Math.min(LEVELS.length - 1, Math.max(0, level))]
  }
  return out
}

// Starts the animation. getHigh() returns the dial (0–10). Returns a stop fn.
export function animateTitle(getHigh, { reduced = false } = {}) {
  if (reduced) {
    document.title = PREFIX
    return () => {}
  }
  let phase = 0
  const tick = () => {
    phase += 0.55
    document.title = PREFIX + waveFrame(phase, getHigh() / 10)
  }
  tick()
  const timer = setInterval(tick, FRAME_MS)
  return () => clearInterval(timer)
}
