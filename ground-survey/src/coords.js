// Pure coordinate and geometry helpers for the Bull Valley unit square
// (x right/east, y down/south — the projection scripts/fetch_bull_valley.cjs
// writes into geo.json). No three.js imports: tests/unit/ground-survey.test.js
// runs these directly in Node.
//
// World space is three.js metres centred on the square: +x east, +z south,
// so north is -z.

export function unitToWorld(u, v, metres) {
  return { x: (u - 0.5) * metres.width, z: (v - 0.5) * metres.height }
}

export function worldToUnit(x, z, metres) {
  return { u: x / metres.width + 0.5, v: z / metres.height + 0.5 }
}

export function unitToLatLon(u, v, bbox) {
  return {
    lat: bbox.north - v * (bbox.north - bbox.south),
    lon: bbox.west + u * (bbox.east - bbox.west),
  }
}

export function formatLatLon({ lat, lon }) {
  const ns = lat >= 0 ? 'N' : 'S'
  const ew = lon >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(4)}° ${ns} ${Math.abs(lon).toFixed(4)}° ${ew}`
}

// Bilinear sample of a size×size height grid over the unit square. Heights are
// normalized 0..1 (terrain.png's 16 bits, R high byte + G low byte); callers
// scale by the metre range recorded in geo.json.terrain.
export function bilinearHeight(heights, size, u, v) {
  const x = Math.min(size - 1.001, Math.max(0, u * (size - 1)))
  const y = Math.min(size - 1.001, Math.max(0, v * (size - 1)))
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const dx = x - ix
  const dy = y - iy
  const at = (a, b) => heights[b * size + a]
  return (
    at(ix, iy) * (1 - dx) * (1 - dy) +
    at(ix + 1, iy) * dx * (1 - dy) +
    at(ix, iy + 1) * (1 - dx) * dy +
    at(ix + 1, iy + 1) * dx * dy
  )
}

// Ray cast over a [[x, y], …] ring.
export function pointInPolygon(x, y, poly) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0]
    const yi = poly[i][1]
    const xj = poly[j][0]
    const yj = poly[j][1]
    const crosses =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (crosses) inside = !inside
  }
  return inside
}

export function polygonBounds(poly) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const [x, y] of poly) {
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  }
  return { minX, minY, maxX, maxY }
}

export function pointSegmentDistance(px, py, ax, ay, bx, by) {
  const dx = bx - ax
  const dy = by - ay
  const len2 = dx * dx + dy * dy
  const t =
    len2 === 0
      ? 0
      : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2))
  const cx = ax + t * dx
  const cy = ay + t * dy
  return Math.hypot(px - cx, py - cy)
}

// Compass bearing of a world-space offset: north (-z) is 0°, east (+x) is 90°.
export function compassBearing(dx, dz) {
  let deg = (Math.atan2(dx, -dz) * 180) / Math.PI
  if (deg < 0) deg += 360
  return deg
}
