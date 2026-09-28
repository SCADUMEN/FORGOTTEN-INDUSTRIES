import { describe, expect, it } from 'vitest'
import {
  targetHerds,
  witching,
  herdSize,
  soloChance,
  gloomFromWeather,
  MAX_HERDS,
} from '../../src/assets/js/bull-valley-scaduscope/density.js'
import {
  temperature,
  windSpeed,
  elevation,
  distance,
  ringKm,
} from '../../src/assets/js/bull-valley-scaduscope/units.js'
import {
  HOURLY_SHARE,
  hourShare,
  busiest,
} from '../../src/assets/js/bull-valley-scaduscope/traffic.js'
import {
  sunPosition,
  moonIllumination,
  darknessFromSun,
  phaseName,
} from '../../src/assets/js/bull-valley-scaduscope/astro.js'

const LAT = 42.3206
const LON = -88.3551
const DEG = 180 / Math.PI
const night = { darkness: 1, moon: 0, gloom: 0 }

describe('shadowmen census', () => {
  it('holds zero herds at high 0 outside the witching hour, all day', () => {
    for (let hour = 0; hour < 24; hour += 0.25) {
      if (hour >= 3 && hour < 4) continue
      for (const darkness of [0, 0.5, 1]) {
        expect(
          targetHerds({ high: 0, darkness, hour, moon: 1, gloom: 1 })
        ).toBe(0)
      }
    }
  })

  it('brings herds out at high 0 during 03:00–03:59 only', () => {
    expect(witching(2.99)).toBe(0)
    expect(witching(3)).toBe(1)
    expect(witching(3.99)).toBe(1)
    expect(witching(4)).toBe(0)
    expect(targetHerds({ high: 0, hour: 3.5, ...night })).toBeGreaterThan(0)
  })

  it('fills the field at high 10 on a dark night, and far less by day', () => {
    const nightCount = targetHerds({ high: 10, hour: 23, ...night })
    const dayCount = targetHerds({ high: 10, hour: 13, darkness: 0 })
    expect(nightCount).toBeGreaterThanOrEqual(25)
    expect(nightCount).toBeLessThanOrEqual(MAX_HERDS)
    expect(dayCount).toBeGreaterThan(0)
    expect(dayCount).toBeLessThan(nightCount / 3)
  })

  it('rises monotonically with high', () => {
    let prev = -1
    for (let high = 0; high <= 10; high++) {
      const n = targetHerds({ high, hour: 22, ...night })
      expect(n).toBeGreaterThanOrEqual(prev)
      prev = n
    }
  })

  it('sends shadowmen out alone most of the time', () => {
    expect(soloChance(0)).toBeCloseTo(0.85)
    expect(soloChance(10)).toBeCloseTo(0.7)
    expect(herdSize(0, 0.8, 0.999)).toBe(1)
    expect(herdSize(10, 0.65, 0.999)).toBe(1)
  })

  it('keeps the occasional herd small: 2–3 sober, up to 6 at high 10', () => {
    expect(herdSize(0, 0.9, 0)).toBe(2)
    expect(herdSize(0, 0.9, 0.999)).toBe(3)
    expect(herdSize(10, 0.9, 0.999)).toBe(6)
  })

  it('reads gloom from fog, rain, and cloud without inventing any', () => {
    expect(gloomFromWeather(null)).toBe(0)
    expect(gloomFromWeather({ code: 0, cloudCover: 0 })).toBe(0)
    expect(gloomFromWeather({ code: 45, cloudCover: 100 })).toBe(1)
  })
})

describe('traffic profile', () => {
  it('distributes exactly one day of traffic across 24 hours', () => {
    expect(HOURLY_SHARE).toHaveLength(24)
    const sum = HOURLY_SHARE.reduce((a, b) => a + b, 0)
    expect(sum).toBeCloseTo(1, 6)
  })

  it('interpolates between hours and wraps at midnight', () => {
    expect(hourShare(7)).toBeCloseTo(HOURLY_SHARE[7])
    expect(hourShare(23.5)).toBeCloseTo(
      (HOURLY_SHARE[23] + HOURLY_SHARE[0]) / 2
    )
  })

  it('names the busiest segment and its hourly estimate', () => {
    const b = busiest(
      [
        { n: 'A', v: 100, y: 2024 },
        { n: 'US-14', v: 18100, y: 2025 },
      ],
      17
    )
    expect(b).toEqual({
      name: 'US-14',
      perHour: Math.round(18100 * HOURLY_SHARE[17]),
      year: 2025,
    })
  })
})

describe('sky', () => {
  // Open-Meteo reported sunrise 06:45 and sunset 18:43 CDT for Bull Valley on
  // 2026-09-26; sunrise/sunset is the sun's centre at -0.833°.
  it('crosses the horizon at the published sunrise and sunset', () => {
    const alt = (iso) => sunPosition(new Date(iso), LAT, LON).altitude * DEG
    expect(alt('2026-09-26T11:44:00Z')).toBeLessThan(-0.833)
    expect(alt('2026-09-26T11:46:00Z')).toBeGreaterThan(-0.833)
    expect(alt('2026-09-26T23:42:00Z')).toBeGreaterThan(-0.833)
    expect(alt('2026-09-26T23:45:00Z')).toBeLessThan(-0.833)
  })

  it('reads a full moon on 2026-09-26', () => {
    const m = moonIllumination(new Date('2026-09-26T18:00:00Z'))
    expect(m.fraction).toBeGreaterThan(0.98)
    expect(phaseName(m.phase)).toBe('Full Moon')
  })

  it('maps sun altitude to darkness from day to astronomical night', () => {
    expect(darknessFromSun(10 / DEG)).toBe(0)
    expect(darknessFromSun(-9 / DEG)).toBeCloseTo(0.5)
    expect(darknessFromSun(-20 / DEG)).toBe(1)
  })
})

describe('units', () => {
  it('shows imperial and metric readings from metric sources', () => {
    expect(temperature(19, 'imperial')).toBe('66°F')
    expect(temperature(19, 'metric')).toBe('19°C')
    expect(windSpeed(9.7, 'imperial')).toBe('6 mph')
    expect(windSpeed(9.7, 'metric')).toBe('10 km/h')
    expect(elevation(308.1, 'imperial')).toBe('1,011')
    expect(elevation(308.1, 'metric')).toBe('308')
    expect(distance(5.2, 'imperial')).toBe('3.2 MI')
    expect(distance(5.2, 'metric')).toBe('5.2 KM')
  })

  it('spaces radar rings a kilometre or a mile apart', () => {
    expect(ringKm('metric')).toBe(1)
    expect(ringKm('imperial')).toBeCloseTo(1.609344)
  })
})

describe('tab title wave', async () => {
  const { waveFrame } =
    await import('../../src/assets/js/bull-valley-scaduscope/title.js')
  const LEVELS = '▁▂▃▄▅▆▇█'
  const span = (s) => {
    const idx = [...s].map((c) => LEVELS.indexOf(c))
    return Math.max(...idx) - Math.min(...idx)
  }

  it('stays six block characters wide, so the title fits a tab', () => {
    for (const phase of [0, 1.3, 2.7, 5]) {
      const frame = waveFrame(phase, 0.5)
      expect([...frame]).toHaveLength(6)
      for (const c of frame) expect(LEVELS).toContain(c)
    }
  })

  it('swells from a ripple when sober to the full range at 10', () => {
    expect(span(waveFrame(0, 0))).toBeLessThanOrEqual(3)
    expect(span(waveFrame(0, 1))).toBeGreaterThanOrEqual(6)
  })
})

describe('radar tempo', async () => {
  const {
    BPM,
    SWEEP_SECONDS,
    SWEEP_BEATS,
    sweepAngle,
    pulse,
    createBeatClock,
  } = await import('../../src/assets/js/bull-valley-scaduscope/radar.js')

  it('turns once every 14 beats at 120 BPM (7 s)', () => {
    expect(BPM).toBe(120)
    expect(SWEEP_BEATS).toBe(14)
    expect(SWEEP_SECONDS).toBe(7)
    expect(sweepAngle(0)).toBe(0)
    expect(sweepAngle(3.5)).toBeCloseTo(Math.PI)
  })

  it('flashes once per whole note (every 2 s) and fades well before the next', () => {
    expect(pulse(0)).toBe(1)
    expect(pulse(2)).toBeCloseTo(1)
    expect(pulse(4)).toBeCloseTo(1)
    // No flash on the other beats of the bar.
    expect(pulse(0.5)).toBeLessThan(0.01)
    expect(pulse(1)).toBeLessThan(0.01)
    expect(pulse(1.5)).toBeLessThan(0.01)
  })

  it('locks the sweep to the song: 12 o’clock on its first beat', () => {
    const clock = createBeatClock()
    // Page has been open 40.3 s when the loop starts at 0.
    expect(clock.now(40.3, 0)).toBeCloseTo(0)
    expect(clock.now(41.3, 1)).toBeCloseTo(1)
    // A 4 s (two-bar) loop wraps to 0.2: the sweep carries on, no jump,
    // and the flash stays on the downbeat.
    expect(clock.now(44.5, 0.2)).toBeCloseTo(4.2)
    // Silence: it free-runs from where it was.
    expect(clock.now(50.3, null)).toBeCloseTo(10)
  })
})

describe('radar downbeat lock', async () => {
  const { createBeatClock, pulse } =
    await import('../../src/assets/js/bull-valley-scaduscope/radar.js')
  it('keeps the flash on the downbeat across many loop seams', () => {
    const clock = createBeatClock()
    const LOOP = 8 // four bars at 120 BPM
    let worst = 0
    for (let i = 0; i <= 60 * 30; i++) {
      const time = 12.34 + i / 30
      const audio = (i / 30) % LOOP
      const beat = clock.now(time, audio)
      // Song downbeats are every 2 s of playback; the flash must peak there.
      if (Math.abs(audio % 2) < 1e-9) worst = Math.max(worst, 1 - pulse(beat))
    }
    expect(worst).toBeLessThan(0.01)
  })
})

describe('radar pulse colour', async () => {
  const { pulseTint } =
    await import('../../src/assets/js/bull-valley-scaduscope/radar.js')
  it('alternates green (high beep, on 0:00) and yellow (low beep) each whole note', () => {
    expect(pulseTint(0)).toBe(0)
    expect(pulseTint(1.99)).toBe(0)
    expect(pulseTint(2)).toBe(1)
    expect(pulseTint(4)).toBe(0)
    expect(pulseTint(6.5)).toBe(1)
  })
})

describe('field log', async () => {
  const { appendLog, entryNote, MAX_ENTRIES } =
    await import('../../src/assets/js/bull-valley-scaduscope/log.js')
  const entry = (name, extra = {}) => ({
    name,
    timesTagged: 1,
    recorded: true,
    at: '2026-09-26T04:00:00Z',
    local: '23:00',
    ...extra,
  })

  it('keeps the newest entry first and caps the log', () => {
    let log = []
    for (let i = 0; i < MAX_ENTRIES + 5; i++)
      log = appendLog(log, entry(`n${i}`))
    expect(log).toHaveLength(MAX_ENTRIES)
    expect(log[0].name).toBe(`n${MAX_ENTRIES + 4}`)
  })

  it('notes first sightings, repeat names, and unrecorded tags', () => {
    expect(entryNote(entry('Mother Ostend'))).toBe('First Sighting')
    expect(entryNote(entry('Mother Ostend', { timesTagged: 14 }))).toBe(
      'Tagged 14×'
    )
    expect(entryNote(entry('Mother Ostend', { recorded: false }))).toBe(
      'Unrecorded'
    )
  })
})

describe('landmarks', async () => {
  const { LANDMARKS, projectLandmarks } =
    await import('../../src/assets/js/bull-valley-scaduscope/landmarks.js')
  const bbox = { south: 42.2775, west: -88.4225, north: 42.374, east: -88.3095 }

  it('projects the frame corners onto the unit square', () => {
    const corners = [
      { n: 'nw', lat: bbox.north, lon: bbox.west },
      { n: 'se', lat: bbox.south, lon: bbox.east },
    ]
    const [nw, se] = projectLandmarks(bbox, corners)
    expect(nw.p[0]).toBeCloseTo(0)
    expect(nw.p[1]).toBeCloseTo(0)
    expect(se.p[0]).toBeCloseTo(1)
    expect(se.p[1]).toBeCloseTo(1)
  })

  it("places Mt. Coleman's Keep north of the village frame", () => {
    expect(LANDMARKS.map((l) => l.n)).toContain("Mt. Coleman's Keep")
    const coleman = projectLandmarks(bbox).find(
      (l) => l.n === "Mt. Coleman's Keep"
    )
    expect(coleman.p[0]).toBeGreaterThan(0)
    expect(coleman.p[0]).toBeLessThan(1)
    expect(coleman.p[1]).toBeLessThan(0)
  })

  it('places the cabbage stand in frame, by the east end of Mason Hill Road', () => {
    const stand = projectLandmarks(bbox).find(
      (l) => l.n === 'Bull Valley Cabbage Stand'
    )
    const [x, y] = stand.p
    expect(x).toBeGreaterThan(0.9)
    expect(x).toBeLessThan(1)
    expect(y).toBeGreaterThan(0)
    expect(y).toBeLessThan(1)
  })
})
