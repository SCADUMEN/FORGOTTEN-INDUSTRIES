// BULL VALLEY SCADUSCOPE units: one place for imperial/metric formatting.
// Everything upstream stays metric (Open-Meteo is requested in °C and km/h;
// the survey is in metres); conversion happens only at display time. The
// visitor's choice persists in localStorage; imperial is the default, since
// Bull Valley is in Illinois.

const STORAGE_KEY = 'bull-valley-scaduscope:v1:units'
const KM_PER_MI = 1.609344
const FT_PER_M = 3.28084

export function readUnits() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'metric'
      ? 'metric'
      : 'imperial'
  } catch (err) {
    return 'imperial'
  }
}

export function writeUnits(units) {
  try {
    localStorage.setItem(STORAGE_KEY, units)
  } catch (err) {
    /* storage unavailable — the choice just won't be remembered */
  }
}

export const isMetric = (units) => units === 'metric'

export function temperature(celsius, units) {
  return isMetric(units)
    ? `${Math.round(celsius)}°C`
    : `${Math.round((celsius * 9) / 5 + 32)}°F`
}

export function windSpeed(kmh, units) {
  return isMetric(units)
    ? `${Math.round(kmh)} km/h`
    : `${Math.round(kmh / KM_PER_MI)} mph`
}

export function elevation(metres, units) {
  return isMetric(units)
    ? `${Math.round(metres)}`
    : `${Math.round(metres * FT_PER_M).toLocaleString('en-US')}`
}

export const elevationUnit = (units) => (isMetric(units) ? 'm' : 'ft')

export function distance(km, units) {
  return isMetric(units)
    ? `${km.toFixed(1)} KM`
    : `${(km / KM_PER_MI).toFixed(1)} MI`
}

// Radar range-ring spacing in kilometres: every 1 km, or every 1 mile.
export function ringKm(units) {
  return isMetric(units) ? 1 : KM_PER_MI
}

// Contour interval label; the contours themselves are drawn every 2 m.
export function contourLabel(units) {
  return isMetric(units) ? '2 m Contours' : '6.6 ft Contours'
}
