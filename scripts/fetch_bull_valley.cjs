#!/usr/bin/env node
'use strict'

// Fetches the real-world layers behind the BULL VALLEY SCADUSCOPE
// (/bull-valley-scaduscope/) and writes them as committed static assets. Run by
// hand when the source data should be refreshed; the site build never calls it.
//
// Why a one-off script and not a build step: the site's Content-Security-Policy
// allows images and data only from 'self' (scripts/build_csp.cjs), and build-time
// network fetches are unreliable (see the nor note in CLAUDE.md). So the terrain,
// roads, water, and traffic counts are fetched once here and shipped as files.
// Only the weather is fetched live, in the browser, from Open-Meteo.
//
// Sources:
//   - Village boundary, public roads, water, nature reserves, graveyards, and
//     gas stations: OpenStreetMap
//     (Nominatim + Overpass), ODbL 1.0.
//   - Traffic: Illinois DOT Annual Average Daily Traffic (AADT) MapServer.
//   - Terrain: AWS Terrain Tiles (Terrarium encoding), built from USGS 3DEP.
//
// Privacy: the survey is public infrastructure only. Driveways, service roads,
// and buildings are never requested, so no output of this script can point at
// a private home. Hand-placed landmarks, including the one private home
// (Mt. Coleman's Keep, added with its owner's consent), live in
// src/assets/js/bull-valley-scaduscope/landmarks.js and are not fetched here.
//
// Outputs (src/assets/data/bull-valley/):
//   geo.json     boundary, roads, water, reserves, and AADT segments, projected
//                into a unit square (x right, y down) and quantized to 1e-4.
//   terrain.png  a 512x512 heightmap over the same square, 16 bits packed as
//                R (high byte) + G (low byte); the elevation range in metres is
//                recorded in geo.json.terrain.
//
// Usage: node scripts/fetch_bull_valley.cjs [--reuse-traffic]
//
// --reuse-traffic keeps the committed AADT segments instead of asking IDOT,
// re-projected from the bbox they were fetched with. For when IDOT is
// unreachable; segments beyond the old query envelope stay missing until a
// full refresh. geo.json records the traffic's own fetch date either way.

const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const OUT = path.join(__dirname, '..', 'src', 'assets', 'data', 'bull-valley')
const UA =
  'forgotten-industries-scaduscope/1.0 (+https://forgottenindustries.org)'

// Bull Valley's OSM bounding box (relation 126046), padded ~500 m so the
// boundary sits inside the frame rather than on its edge. The north edge
// reaches on into Wonder Lake (~600 m past 42.3839) so Mt. Coleman's Keep
// (src/assets/js/bull-valley-scaduscope/landmarks.js) sits on the map.
const BBOX = { south: 42.2775, west: -88.4225, north: 42.3895, east: -88.3095 }
// Bull Valley itself has no gas stations, so the fuel search reaches ~8 km past
// the frame. Stations outside the unit square keep their out-of-range
// coordinates; the page draws them as bearings on the frame edge.
const FUEL_BBOX = { south: 42.205, west: -88.52, north: 42.446, east: -88.212 }
const TERRAIN_SIZE = 512
const TERRAIN_ZOOM = 13

const OVERPASS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

// Public road classes only. Service roads (driveways, parking aisles) and
// footways are excluded on purpose — see the privacy note above.
const ROAD_CLASSES = [
  'motorway',
  'trunk',
  'primary',
  'secondary',
  'tertiary',
  'unclassified',
  'residential',
  'motorway_link',
  'trunk_link',
  'primary_link',
  'secondary_link',
  'tertiary_link',
]

// Equirectangular projection into the unit square, corrected for latitude so
// a metre is the same length on both axes. The square's aspect is recorded.
const MID_LAT = ((BBOX.north + BBOX.south) / 2) * (Math.PI / 180)
const WIDTH_M = (BBOX.east - BBOX.west) * 111320 * Math.cos(MID_LAT)
const HEIGHT_M = (BBOX.north - BBOX.south) * 110574
const q = (n) => Math.round(n * 1e4) / 1e4
const project = (lon, lat) => [
  q((lon - BBOX.west) / (BBOX.east - BBOX.west)),
  q((BBOX.north - lat) / (BBOX.north - BBOX.south)),
]

async function fetchJson(url, init = {}) {
  const res = await fetch(url, {
    ...init,
    headers: { 'User-Agent': UA, ...(init.headers || {}) },
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`)
  return res.json()
}

async function overpass(query) {
  const body = new URLSearchParams({ data: query })
  let lastErr
  for (const endpoint of OVERPASS) {
    try {
      return await fetchJson(endpoint, { method: 'POST', body })
    } catch (err) {
      console.warn(`[overpass] ${endpoint} failed: ${err.message}`)
      lastErr = err
    }
  }
  throw lastErr
}

async function fetchBoundary() {
  const url =
    'https://nominatim.openstreetmap.org/lookup?osm_ids=R126046&format=json&polygon_geojson=1'
  const [place] = await fetchJson(url)
  if (!place?.geojson) throw new Error('Bull Valley boundary not returned')
  const { type, coordinates } = place.geojson
  const polys = type === 'Polygon' ? [coordinates] : coordinates
  return polys.map((poly) => poly[0].map(([lon, lat]) => project(lon, lat)))
}

async function fetchOsm() {
  const bb = `${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east}`
  const fuelBb = `${FUEL_BBOX.south},${FUEL_BBOX.west},${FUEL_BBOX.north},${FUEL_BBOX.east}`
  const query = `[out:json][timeout:60];
(
  way["highway"~"^(${ROAD_CLASSES.join('|')})$"](${bb});
  way["waterway"~"^(river|stream|canal)$"](${bb});
  way["natural"="water"](${bb});
  way["natural"="wetland"](${bb});
  way["leisure"="nature_reserve"](${bb});
  way["landuse"="cemetery"](${bb});
  way["amenity"="grave_yard"](${bb});
);
out tags geom;
(
  node["landuse"="cemetery"](${bb});
  node["amenity"="grave_yard"](${bb});
  nwr["amenity"="fuel"](${fuelBb});
);
out tags center;`
  const data = await overpass(query)
  const roads = []
  const water = []
  const wetland = []
  const reserves = []
  const graveyards = []
  const fuel = []
  for (const el of data.elements) {
    const t = el.tags || {}
    // Point features: a node's own position, or a way/relation's centre.
    const point = el.center || (el.type === 'node' ? el : null)
    if (t.amenity === 'fuel' && point) {
      fuel.push({
        n: t.name || t.brand || '',
        p: project(point.lon, point.lat),
      })
      continue
    }
    const isGraveyard = t.landuse === 'cemetery' || t.amenity === 'grave_yard'
    if (isGraveyard && el.type === 'node') {
      graveyards.push({ n: t.name || '', c: project(el.lon, el.lat), p: [] })
      continue
    }
    if (el.type !== 'way' || !el.geometry) continue
    if (isGraveyard) {
      const ring = el.geometry.map((p) => project(p.lon, p.lat))
      const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length
      const cy = ring.reduce((s, p) => s + p[1], 0) / ring.length
      graveyards.push({ n: t.name || '', c: [q(cx), q(cy)], p: ring })
      continue
    }
    const line = el.geometry.map((p) => project(p.lon, p.lat))
    if (t.highway) {
      roads.push({
        c: t.highway.replace('_link', ''),
        n: t.name || '',
        p: line,
      })
    } else if (t.waterway) {
      water.push({ k: 'line', n: t.name || '', p: line })
    } else if (t.natural === 'water') {
      water.push({ k: 'area', n: t.name || '', p: line })
    } else if (t.natural === 'wetland') {
      wetland.push(line)
    } else if (t.leisure === 'nature_reserve') {
      reserves.push({ n: t.name || '', p: line })
    }
  }
  return { roads, water, wetland, reserves, graveyards, fuel }
}

async function fetchTraffic() {
  const params = new URLSearchParams({
    where: '1=1',
    geometry: `${BBOX.west},${BBOX.south},${BBOX.east},${BBOX.north}`,
    geometryType: 'esriGeometryEnvelope',
    inSR: '4326',
    outSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'ROAD_NAME,MARKED_NAM,AADT,AADT_YR,HCV_AADT',
    returnGeometry: 'true',
    f: 'json',
  })
  const url = `https://gis1.dot.illinois.gov/arcgis/rest/services/AdministrativeData/AADT/MapServer/0/query?${params}`
  const data = await fetchJson(url)
  if (data.error) throw new Error(`IDOT: ${JSON.stringify(data.error)}`)
  if (data.exceededTransferLimit) {
    throw new Error('IDOT result was truncated; page the query')
  }
  const segments = []
  for (const f of data.features) {
    const a = f.attributes
    if (!a.AADT) continue
    for (const pathPts of f.geometry?.paths || []) {
      segments.push({
        n: (a.ROAD_NAME || a.MARKED_NAM || '').trim(),
        v: a.AADT,
        y: a.AADT_YR,
        h: a.HCV_AADT || 0,
        p: pathPts.map(([lon, lat]) => project(lon, lat)),
      })
    }
  }
  return segments
}

// The committed AADT segments, un-projected from the bbox recorded with them
// and projected into the current one. See --reuse-traffic in the header.
function reuseTraffic() {
  const prev = JSON.parse(fs.readFileSync(path.join(OUT, 'geo.json'), 'utf8'))
  const b = prev.bbox
  const traffic = prev.traffic.map((s) => ({
    ...s,
    p: s.p.map(([x, y]) =>
      project(b.west + x * (b.east - b.west), b.north - y * (b.north - b.south))
    ),
  }))
  return { traffic, trafficFetched: prev.trafficFetched || prev.fetched }
}

// Web Mercator tile maths.
const lonToTileX = (lon, z) => ((lon + 180) / 360) * 2 ** z
const latToTileY = (lat, z) => {
  const r = (lat * Math.PI) / 180
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z
}

async function fetchTerrain() {
  const z = TERRAIN_ZOOM
  const x0 = Math.floor(lonToTileX(BBOX.west, z))
  const x1 = Math.floor(lonToTileX(BBOX.east, z))
  const y0 = Math.floor(latToTileY(BBOX.north, z))
  const y1 = Math.floor(latToTileY(BBOX.south, z))
  const cols = x1 - x0 + 1
  const rows = y1 - y0 + 1

  // Decode each Terrarium tile to metres: (R*256 + G + B/256) - 32768.
  const mosaic = new Float32Array(cols * 256 * rows * 256)
  const mosaicW = cols * 256
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${tx}/${ty}.png`
      const res = await fetch(url, { headers: { 'User-Agent': UA } })
      if (!res.ok) throw new Error(`${res.status} for ${url}`)
      const { data, info } = await sharp(Buffer.from(await res.arrayBuffer()))
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })
      if (info.width !== 256 || info.height !== 256) {
        throw new Error(`unexpected tile size ${info.width}x${info.height}`)
      }
      for (let py = 0; py < 256; py++) {
        for (let px = 0; px < 256; px++) {
          const i = (py * 256 + px) * 3
          const m = data[i] * 256 + data[i + 1] + data[i + 2] / 256 - 32768
          const mx = (tx - x0) * 256 + px
          const my = (ty - y0) * 256 + py
          mosaic[my * mosaicW + mx] = m
        }
      }
    }
  }

  // Resample onto the unit square (bilinear), so the heightmap lines up with
  // the equirectangular vector layers rather than with Mercator tiles.
  const N = TERRAIN_SIZE
  const heights = new Float32Array(N * N)
  const sample = (fx, fy) => {
    const x = Math.min(mosaicW - 2, Math.max(0, fx))
    const y = Math.min(rows * 256 - 2, Math.max(0, fy))
    const ix = Math.floor(x)
    const iy = Math.floor(y)
    const dx = x - ix
    const dy = y - iy
    const at = (a, b) => mosaic[b * mosaicW + a]
    return (
      at(ix, iy) * (1 - dx) * (1 - dy) +
      at(ix + 1, iy) * dx * (1 - dy) +
      at(ix, iy + 1) * (1 - dx) * dy +
      at(ix + 1, iy + 1) * dx * dy
    )
  }
  let min = Infinity
  let max = -Infinity
  for (let j = 0; j < N; j++) {
    const lat = BBOX.north - ((j + 0.5) / N) * (BBOX.north - BBOX.south)
    const fy = (latToTileY(lat, z) - y0) * 256
    for (let i = 0; i < N; i++) {
      const lon = BBOX.west + ((i + 0.5) / N) * (BBOX.east - BBOX.west)
      const fx = (lonToTileX(lon, z) - x0) * 256
      const h = sample(fx, fy)
      heights[j * N + i] = h
      if (h < min) min = h
      if (h > max) max = h
    }
  }

  // 16 bits of normalized height packed into two 8-bit channels: R is the high
  // byte, G the low byte, B unused. WebGL uploads PNGs at 8 bits per channel,
  // so a 16-bit grayscale PNG would lose its precision on the way in; the
  // shader reassembles height = (R*256 + G) / 65535 instead.
  const pixels = Buffer.alloc(N * N * 3)
  for (let k = 0; k < heights.length; k++) {
    const v = Math.round(((heights[k] - min) / (max - min)) * 65535)
    pixels[k * 3] = v >> 8
    pixels[k * 3 + 1] = v & 255
  }
  await sharp(pixels, { raw: { width: N, height: N, channels: 3 } })
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT, 'terrain.png'))

  return {
    size: N,
    min: Math.round(min * 10) / 10,
    max: Math.round(max * 10) / 10,
  }
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true })
  const today = new Date().toISOString().slice(0, 10)
  const reuse = process.argv.includes('--reuse-traffic')
  const [boundary, osm, { traffic, trafficFetched }, terrain] = [
    await fetchBoundary(),
    await fetchOsm(),
    reuse
      ? reuseTraffic()
      : { traffic: await fetchTraffic(), trafficFetched: today },
    await fetchTerrain(),
  ]
  const geo = {
    fetched: today,
    trafficFetched,
    bbox: BBOX,
    metres: { width: Math.round(WIDTH_M), height: Math.round(HEIGHT_M) },
    terrain,
    boundary,
    ...osm,
    traffic,
    sources: {
      osm: 'OpenStreetMap contributors, ODbL 1.0',
      traffic: 'Illinois Department of Transportation, AADT',
      terrain: 'AWS Terrain Tiles (Terrarium), USGS 3DEP',
    },
  }
  fs.writeFileSync(path.join(OUT, 'geo.json'), JSON.stringify(geo))
  console.log(
    `boundary rings ${boundary.length}, roads ${osm.roads.length}, water ${osm.water.length}, ` +
      `wetland ${osm.wetland.length}, reserves ${osm.reserves.length}, graveyards ${osm.graveyards.length}, ` +
      `fuel ${osm.fuel.length}, traffic ${traffic.length}, ` +
      `terrain ${terrain.min}–${terrain.max} m`
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
