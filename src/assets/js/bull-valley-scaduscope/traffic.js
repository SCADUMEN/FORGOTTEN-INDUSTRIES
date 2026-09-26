// BULL VALLEY SCADUSCOPE traffic: real Illinois DOT annual average daily
// traffic (AADT) per road segment, spread across the day with an assumed
// weekday hourly profile. The counts are measured; the flow is simulated.
//
// The curve is an assumed two-peak weekday shape (relative traffic in each
// local hour, 00–23). It is a typical shape, not a measured profile for these
// roads, and the page labels traffic as an estimate accordingly. The weights
// are normalized so HOURLY_SHARE always sums to exactly one day.

const HOURLY_WEIGHT = [
  0.008, 0.005, 0.004, 0.004, 0.007, 0.018, 0.047, 0.07, 0.064, 0.05, 0.047,
  0.051, 0.055, 0.055, 0.059, 0.068, 0.078, 0.078, 0.06, 0.044, 0.035, 0.028,
  0.019, 0.012,
]
const WEIGHT_TOTAL = HOURLY_WEIGHT.reduce((a, b) => a + b, 0)
export const HOURLY_SHARE = HOURLY_WEIGHT.map((w) => w / WEIGHT_TOTAL)

// Share of daily traffic in a fractional local hour, interpolated so the flow
// eases between hours instead of stepping.
export function hourShare(hour) {
  const i = Math.floor(hour) % 24
  const t = hour - Math.floor(hour)
  return HOURLY_SHARE[i] * (1 - t) + HOURLY_SHARE[(i + 1) % 24] * t
}

// Vehicles per hour on a segment right now.
export function vehiclesPerHour(aadt, hour) {
  return aadt * hourShare(hour)
}

// Busiest road right now: { name, perHour, year } from the segment list.
export function busiest(segments, hour) {
  let best = null
  for (const s of segments) {
    if (!best || s.v > best.v) best = s
  }
  if (!best) return null
  return {
    name: best.n,
    perHour: Math.round(vehiclesPerHour(best.v, hour)),
    year: best.y,
  }
}
