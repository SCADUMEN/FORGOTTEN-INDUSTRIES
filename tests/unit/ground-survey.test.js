import { describe, expect, it } from 'vitest'
import {
  bilinearHeight,
  compassBearing,
  formatLatLon,
  pointInPolygon,
  pointSegmentDistance,
  unitToLatLon,
  unitToWorld,
  worldToUnit,
} from '../../ground-survey/src/coords.js'
import { nervesIntensity, stepNerves } from '../../ground-survey/src/nerves.js'
import {
  STARTING_INVENTORY,
  addItem,
  loadInventory,
  saveInventory,
  useItem,
} from '../../ground-survey/src/inventory.js'

const METRES = { width: 9300, height: 10670 }
const BBOX = { south: 42.2775, west: -88.4225, north: 42.374, east: -88.3095 }

describe('coords', () => {
  it('centres the unit square on the world origin', () => {
    expect(unitToWorld(0.5, 0.5, METRES)).toEqual({ x: 0, z: 0 })
    expect(unitToWorld(0, 0, METRES)).toEqual({ x: -4650, z: -5335 })
    expect(unitToWorld(1, 1, METRES)).toEqual({ x: 4650, z: 5335 })
  })

  it('round-trips world to unit coordinates', () => {
    const { u, v } = worldToUnit(1234, -987, METRES)
    const { x, z } = unitToWorld(u, v, METRES)
    expect(x).toBeCloseTo(1234, 6)
    expect(z).toBeCloseTo(-987, 6)
  })

  it('maps unit coordinates to the bbox corners (y down = south)', () => {
    expect(unitToLatLon(0, 0, BBOX)).toEqual({ lat: BBOX.north, lon: BBOX.west })
    expect(unitToLatLon(1, 1, BBOX)).toEqual({ lat: BBOX.south, lon: BBOX.east })
  })

  it('formats western-hemisphere positions', () => {
    expect(formatLatLon({ lat: 42.32, lon: -88.36 })).toBe(
      '42.3200° N 88.3600° W'
    )
  })

  it('samples a height grid bilinearly', () => {
    // 2×2 grid: 0 across the top row, 1 across the bottom.
    const heights = Float32Array.from([0, 0, 1, 1])
    expect(bilinearHeight(heights, 2, 0, 0)).toBeCloseTo(0, 5)
    expect(bilinearHeight(heights, 2, 0.5, 1)).toBeCloseTo(1, 2)
    expect(bilinearHeight(heights, 2, 0.5, 0.5)).toBeCloseTo(0.5, 2)
    // Out-of-range samples clamp instead of reading out of bounds.
    expect(bilinearHeight(heights, 2, -1, 2)).toBeCloseTo(1, 2)
  })

  it('tests points against polygon rings', () => {
    const square = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ]
    expect(pointInPolygon(0.5, 0.5, square)).toBe(true)
    expect(pointInPolygon(1.5, 0.5, square)).toBe(false)
  })

  it('measures point-to-segment distance including endpoints', () => {
    expect(pointSegmentDistance(0, 1, -1, 0, 1, 0)).toBeCloseTo(1, 6)
    expect(pointSegmentDistance(3, 0, -1, 0, 1, 0)).toBeCloseTo(2, 6)
    expect(pointSegmentDistance(5, 5, 2, 2, 2, 2)).toBeCloseTo(
      Math.hypot(3, 3),
      6
    )
  })

  it('gives compass bearings with north at -z', () => {
    expect(compassBearing(0, -1)).toBeCloseTo(0, 5) // north
    expect(compassBearing(1, 0)).toBeCloseTo(90, 5) // east
    expect(compassBearing(0, 1)).toBeCloseTo(180, 5) // south
    expect(compassBearing(-1, 0)).toBeCloseTo(270, 5) // west
  })
})

describe('nerves', () => {
  it('decays toward calm when nothing is near', () => {
    const next = stepNerves(50, { dt: 1, pressure: 0 })
    expect(next).toBeLessThan(50)
  })

  it('climbs under pressure and clamps at 100', () => {
    let n = 20
    for (let i = 0; i < 60; i++) n = stepNerves(n, { dt: 1, pressure: 3 })
    expect(n).toBe(100)
  })

  it('never goes below zero', () => {
    expect(stepNerves(0.5, { dt: 10, pressure: 0 })).toBe(0)
  })

  it('drains fast while smoking', () => {
    const calm = stepNerves(80, { dt: 1, pressure: 0, smoking: true })
    const idle = stepNerves(80, { dt: 1, pressure: 0 })
    expect(calm).toBeLessThan(idle)
  })

  it('dulls the gain under perception (weed)', () => {
    const stoned = stepNerves(40, { dt: 1, pressure: 2, perception: true })
    const sober = stepNerves(40, { dt: 1, pressure: 2 })
    expect(stoned).toBeLessThan(sober)
  })

  it('eases intensity in from the bottom third', () => {
    expect(nervesIntensity(0)).toBe(0)
    expect(nervesIntensity(30)).toBe(0)
    expect(nervesIntensity(100)).toBeCloseTo(1, 5)
  })
})

describe('inventory', () => {
  it('adds and uses items without going negative', () => {
    let inv = { cigarettes: 1, joints: 0 }
    inv = addItem(inv, 'joints', 2)
    expect(inv).toEqual({ cigarettes: 1, joints: 2 })
    const used = useItem(inv, 'cigarettes')
    expect(used.used).toBe(true)
    expect(used.inv.cigarettes).toBe(0)
    const empty = useItem(used.inv, 'cigarettes')
    expect(empty.used).toBe(false)
    expect(empty.inv.cigarettes).toBe(0)
  })

  it('round-trips through a storage stub and survives junk', () => {
    const store = new Map()
    const storage = {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, value) => store.set(k, value),
    }
    expect(loadInventory(storage)).toEqual(STARTING_INVENTORY)
    saveInventory(storage, { cigarettes: 7, joints: 3 })
    expect(loadInventory(storage)).toEqual({ cigarettes: 7, joints: 3 })
    for (const [k] of store) store.set(k, '{not json')
    expect(loadInventory(storage)).toEqual(STARTING_INVENTORY)
  })
})
