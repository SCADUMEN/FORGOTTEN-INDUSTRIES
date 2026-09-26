// BULL VALLEY SCADUSCOPE census rules: how many shadowmen sightings the field
// holds right now, and how many figures each one is. A sighting is usually a
// lone shadowman; now and then it is a herd. Pure functions — no DOM, no clock
// — so the rules are unit-tested (tests/unit/scaduscope.test.js). In code a
// sighting is a "herd", including a herd of one.
//
// The shadowmen are fiction; their inputs are not. Darkness comes from the real
// sun, the moon from the real sky, gloom from the live weather, and the hour
// from Bull Valley's own clock. Only `high` is the Operator's.
//
// The rules:
//  - high 0: shadowmen appear only in the witching hour (03:00–03:59, Bull
//    Valley time). Every other hour of the day the census is zero.
//  - high 1–10: they also surface outside the witching hour, many more by
//    night than by day, rising steeply with high. At 10 on a dark night the
//    field carries ~30 sightings, i.e. they are basically everywhere.
//  - a bright moon and foul weather each add to the count; neither can raise
//    it above zero on their own at high 0.
//  - shadowmen usually travel alone: 85% of sightings are solitary when sober,
//    70% at high 10; the rest are small herds, 2–3 strong, up to 6 at 10.

export const MAX_HIGH = 10
export const MAX_HERDS = 40

// 1 during 03:00–03:59 local, else 0. `hour` is a fractional local hour.
export function witching(hour) {
  return hour >= 3 && hour < 4 ? 1 : 0
}

// Weather gloom 0..1 from Open-Meteo fields: cloud cover, fog, precipitation.
// Missing weather counts as no gloom rather than guessing.
export function gloomFromWeather(weather) {
  if (!weather) return 0
  const cloud = clamp01((weather.cloudCover ?? 0) / 100)
  const code = weather.code ?? 0
  const fog = code === 45 || code === 48 ? 1 : 0
  const wet = code >= 51 ? 1 : 0
  return clamp01(cloud * 0.4 + fog * 0.6 + wet * 0.4)
}

// Expected sighting count (a real number; the caller rounds stochastically).
export function targetHerds({ high, darkness, hour, moon = 0, gloom = 0 }) {
  const h = clamp01(high / MAX_HIGH)
  const w = witching(hour)
  const boost = 1 + 0.35 * clamp01(moon) + 0.25 * clamp01(gloom)
  const hourly = w * (3 + 4 * h)
  const ambient = Math.pow(h, 1.3) * (26 * darkness + 5 * (1 - darkness))
  return Math.min(MAX_HERDS, (hourly + ambient) * boost)
}

// Chance a sighting is a lone shadowman: 0.85 when sober, 0.70 at high 10.
export function soloChance(high) {
  return 0.85 - 0.15 * clamp01(high / MAX_HIGH)
}

// Figures in a sighting. `roll` decides solo vs herd; `spread` sizes a herd:
// 2–3 when sober, up to 2–6 at high 10.
export function herdSize(high, roll, spread) {
  if (roll < soloChance(high)) return 1
  const h = clamp01(high / MAX_HIGH)
  return 2 + Math.floor(spread * (2 + 3 * h))
}

function clamp01(n) {
  return Math.min(1, Math.max(0, n))
}
