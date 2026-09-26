// BULL VALLEY SCADUSCOPE sky: sun and moon positions and the moon's phase,
// computed locally — no network. The formulas follow SunCalc
// (https://github.com/mourner/suncalc, BSD-2-Clause, Vladimir Agafonkin), which
// in turn follows the astronomy articles at aa.quae.nl. Accuracy is a fraction
// of a degree, which is far finer than the instrument needs.

const RAD = Math.PI / 180
const DAY_MS = 86400000
const J1970 = 2440588
const J2000 = 2451545
const OBLIQUITY = RAD * 23.4397

const toDays = (date) => date.valueOf() / DAY_MS - 0.5 + J1970 - J2000

const rightAscension = (l, b) =>
  Math.atan2(
    Math.sin(l) * Math.cos(OBLIQUITY) - Math.tan(b) * Math.sin(OBLIQUITY),
    Math.cos(l)
  )
const declination = (l, b) =>
  Math.asin(
    Math.sin(b) * Math.cos(OBLIQUITY) +
      Math.cos(b) * Math.sin(OBLIQUITY) * Math.sin(l)
  )
const azimuth = (H, phi, dec) =>
  Math.atan2(
    Math.sin(H),
    Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi)
  )
const altitude = (H, phi, dec) =>
  Math.asin(
    Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H)
  )
const siderealTime = (d, lw) => RAD * (280.16 + 360.9856235 * d) - lw

const solarMeanAnomaly = (d) => RAD * (357.5291 + 0.98560028 * d)
function eclipticLongitude(M) {
  const C =
    RAD *
    (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M))
  const P = RAD * 102.9372 // perihelion of the Earth
  return M + C + P + Math.PI
}

function sunCoords(d) {
  const L = eclipticLongitude(solarMeanAnomaly(d))
  return { dec: declination(L, 0), ra: rightAscension(L, 0) }
}

function moonCoords(d) {
  const L = RAD * (218.316 + 13.176396 * d) // ecliptic longitude
  const M = RAD * (134.963 + 13.064993 * d) // mean anomaly
  const F = RAD * (93.272 + 13.22935 * d) // mean distance
  const l = L + RAD * 6.289 * Math.sin(M)
  const b = RAD * 5.128 * Math.sin(F)
  const dist = 385001 - 20905 * Math.cos(M) // km
  return { ra: rightAscension(l, b), dec: declination(l, b), dist }
}

// Sun position. Altitude and azimuth in radians; azimuth is measured from
// south, positive toward west (SunCalc's convention).
export function sunPosition(date, lat, lon) {
  const lw = RAD * -lon
  const phi = RAD * lat
  const d = toDays(date)
  const c = sunCoords(d)
  const H = siderealTime(d, lw) - c.ra
  return { altitude: altitude(H, phi, c.dec), azimuth: azimuth(H, phi, c.dec) }
}

export function moonPosition(date, lat, lon) {
  const lw = RAD * -lon
  const phi = RAD * lat
  const d = toDays(date)
  const c = moonCoords(d)
  const H = siderealTime(d, lw) - c.ra
  let h = altitude(H, phi, c.dec)
  h += (RAD * 0.017) / Math.tan(h + (RAD * 10.26) / (h + RAD * 5.1)) // refraction
  return { altitude: h, azimuth: azimuth(H, phi, c.dec) }
}

// Illuminated fraction (0..1) and phase (0 new, 0.25 first quarter, 0.5 full,
// 0.75 last quarter).
export function moonIllumination(date) {
  const d = toDays(date)
  const s = sunCoords(d)
  const m = moonCoords(d)
  const SUN_DIST = 149598000 // km
  const phi = Math.acos(
    Math.sin(s.dec) * Math.sin(m.dec) +
      Math.cos(s.dec) * Math.cos(m.dec) * Math.cos(s.ra - m.ra)
  )
  const inc = Math.atan2(
    SUN_DIST * Math.sin(phi),
    m.dist - SUN_DIST * Math.cos(phi)
  )
  const angle = Math.atan2(
    Math.cos(s.dec) * Math.sin(s.ra - m.ra),
    Math.sin(s.dec) * Math.cos(m.dec) -
      Math.cos(s.dec) * Math.sin(m.dec) * Math.cos(s.ra - m.ra)
  )
  return {
    fraction: (1 + Math.cos(inc)) / 2,
    phase: 0.5 + (0.5 * inc * (angle < 0 ? -1 : 1)) / Math.PI,
  }
}

const PHASE_NAMES = [
  'New Moon',
  'Waxing Crescent',
  'First Quarter',
  'Waxing Gibbous',
  'Full Moon',
  'Waning Gibbous',
  'Last Quarter',
  'Waning Crescent',
]

export function phaseName(phase) {
  return PHASE_NAMES[Math.round(phase * 8) % 8]
}

// Darkness from the sun's altitude: 0 in full daylight, 1 once the sun is
// below astronomical twilight (-18°), easing through the twilights between.
export function darknessFromSun(altitudeRad) {
  const deg = altitudeRad / RAD
  if (deg >= 0) return 0
  if (deg <= -18) return 1
  const t = -deg / 18
  return t * t * (3 - 2 * t)
}

export function sunLabel(altitudeRad) {
  const deg = altitudeRad / RAD
  if (deg >= 6) return 'Day'
  if (deg >= -0.833) return 'Golden Hour'
  if (deg >= -6) return 'Civil Twilight'
  if (deg >= -12) return 'Nautical Twilight'
  if (deg >= -18) return 'Astronomical Twilight'
  return 'Night'
}
