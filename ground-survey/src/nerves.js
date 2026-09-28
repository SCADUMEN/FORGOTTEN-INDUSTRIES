// The nerves meter, 0–100. Pure functions: tests drive them directly.

// pressure is the shadowmen system's summed proximity weight (0 = alone,
// hunting entities weigh triple). Smoking a cigarette drains the meter fast;
// weed perception dulls the gain — you feel less than is true, which is the
// trade the joint makes.
export function stepNerves(
  nerves,
  { dt, pressure = 0, smoking = false, perception = false }
) {
  const gainScale = perception ? 0.45 : 1
  const gain = pressure * 10 * gainScale
  const decay = smoking ? 10 : 1.4
  const next = nerves + (gain - decay) * dt
  return Math.max(0, Math.min(100, next))
}

// How hard the view sways and vignettes for a given nerves level, eased so the
// bottom third of the meter stays imperceptible.
export function nervesIntensity(nerves) {
  const t = Math.max(0, (nerves - 30) / 70)
  return t * t
}
