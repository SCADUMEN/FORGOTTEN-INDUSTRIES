// BULL VALLEY SCADUSCOPE weather: live conditions over the village from
// Open-Meteo (https://open-meteo.com, no key, CORS-open). This is the one live
// network call the instrument makes; its origin is allowed in connect-src by
// scripts/build_csp.cjs. Polls every 15 minutes, which matches the model's
// own 15-minute `current` interval. A failed fetch keeps the last good reading
// and reports the outage rather than inventing weather. Readings stay in
// Open-Meteo's default units (°C, km/h); units.js converts for display.

const LAT = 42.3206
const LON = -88.3551
const POLL_MS = 15 * 60 * 1000
const URL =
  'https://api.open-meteo.com/v1/forecast' +
  `?latitude=${LAT}&longitude=${LON}` +
  '&current=temperature_2m,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,precipitation' +
  '&timezone=America%2FChicago'

// WMO weather interpretation codes, as published in the Open-Meteo docs.
const CODES = {
  0: 'Clear Sky',
  1: 'Mainly Clear',
  2: 'Partly Cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing Rime Fog',
  51: 'Light Drizzle',
  53: 'Moderate Drizzle',
  55: 'Dense Drizzle',
  56: 'Light Freezing Drizzle',
  57: 'Dense Freezing Drizzle',
  61: 'Slight Rain',
  63: 'Moderate Rain',
  65: 'Heavy Rain',
  66: 'Light Freezing Rain',
  67: 'Heavy Freezing Rain',
  71: 'Slight Snowfall',
  73: 'Moderate Snowfall',
  75: 'Heavy Snowfall',
  77: 'Snow Grains',
  80: 'Slight Rain Showers',
  81: 'Moderate Rain Showers',
  82: 'Violent Rain Showers',
  85: 'Slight Snow Showers',
  86: 'Heavy Snow Showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm, Slight Hail',
  99: 'Thunderstorm, Heavy Hail',
}

export function describeCode(code) {
  return CODES[code] || `WMO ${code}`
}

// Starts polling. onUpdate({ reading, error }) fires after every attempt;
// reading is the last good reading (null until one arrives).
export function watchWeather(onUpdate) {
  let reading = null
  let timer = 0

  async function poll() {
    let error = null
    try {
      const res = await fetch(URL)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const c = (await res.json()).current
      reading = {
        at: c.time,
        tempC: c.temperature_2m,
        code: c.weather_code,
        cloudCover: c.cloud_cover,
        windKmh: c.wind_speed_10m,
        windFrom: c.wind_direction_10m,
        precipitation: c.precipitation,
      }
    } catch (err) {
      error = err
      console.warn('[scaduscope] weather fetch failed:', err)
    }
    onUpdate({ reading, error })
    timer = setTimeout(poll, POLL_MS)
  }

  poll()
  return () => clearTimeout(timer)
}
