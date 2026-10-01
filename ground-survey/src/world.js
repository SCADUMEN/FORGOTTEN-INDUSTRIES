import * as THREE from 'three'
import {
  unitToWorld,
  pointInPolygon,
  polygonBounds,
  pointSegmentDistance,
} from './coords.js'
import { applyPS1 } from './ps1.js'
import { mulberry32, range } from './rng.js'

// Builds every static feature of Bull Valley from the Scaduscope's geo.json:
// roads, water, wetland reeds, woods, graveyards, fuel stations, the village
// boundary. Returns the scene group plus the gameplay anchors main.js needs.

// Unlit (MeshBasicMaterial) tones — these render exactly as written, then fog.
const ROAD_STYLE = {
  motorway: { width: 9, color: '#343a41' },
  trunk: { width: 9, color: '#343a41' },
  primary: { width: 8, color: '#32383f' },
  secondary: { width: 7, color: '#30353c' },
  tertiary: { width: 6, color: '#2d3238' },
  residential: { width: 5, color: '#2a2f35' },
  unclassified: { width: 5, color: '#2a2f35' },
  service: { width: 3.5, color: '#332e22' },
  track: { width: 3, color: '#363023' },
}
const ROAD_DEFAULT = { width: 4.5, color: '#2a2f35' }

function lambert(opts) {
  return applyPS1(new THREE.MeshLambertMaterial(opts))
}

// Accumulates flat ribbons (roads, streams) into one non-indexed geometry.
function makeRibbonAccumulator() {
  const positions = []
  const colors = []
  return {
    add(points, width, color, lift) {
      if (points.length < 2) return
      const c = new THREE.Color(color)
      const half = width / 2
      // Per-point direction averaged over neighbouring segments (naive miter).
      const dirs = []
      for (let i = 0; i < points.length; i++) {
        const a = points[Math.max(0, i - 1)]
        const b = points[Math.min(points.length - 1, i + 1)]
        const dx = b.x - a.x
        const dz = b.z - a.z
        const len = Math.hypot(dx, dz) || 1
        dirs.push({ x: dx / len, z: dz / len })
      }
      const left = points.map((pt, i) => ({
        x: pt.x - dirs[i].z * half,
        y: pt.y + lift,
        z: pt.z + dirs[i].x * half,
      }))
      const right = points.map((pt, i) => ({
        x: pt.x + dirs[i].z * half,
        y: pt.y + lift,
        z: pt.z - dirs[i].x * half,
      }))
      for (let i = 0; i < points.length - 1; i++) {
        const quad = [left[i], left[i + 1], right[i], right[i + 1]]
        for (const v of [quad[0], quad[2], quad[1], quad[1], quad[2], quad[3]]) {
          positions.push(v.x, v.y, v.z)
          colors.push(c.r, c.g, c.b)
        }
      }
    },
    build(name) {
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(positions), 3)
      )
      geometry.setAttribute(
        'color',
        new THREE.BufferAttribute(new Float32Array(colors), 3)
      )
      const normals = new Float32Array(positions.length)
      for (let i = 0; i < normals.length; i += 3) normals[i + 1] = 1
      geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
      // Basic, not lambert: ribbon winding flips with the direction each
      // polyline was digitized in, so lighting by face normal would render
      // half the roads unlit. Flat night asphalt wants a constant tone anyway;
      // fog still applies. DoubleSide keeps the flipped half visible.
      const mesh = new THREE.Mesh(
        geometry,
        applyPS1(
          new THREE.MeshBasicMaterial({
            vertexColors: true,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            side: THREE.DoubleSide,
          })
        )
      )
      mesh.name = name
      return mesh
    },
  }
}

function toWorldPoints(unitPoints, metres, heightAt) {
  return unitPoints.map(([u, v]) => {
    const { x, z } = unitToWorld(u, v, metres)
    return { x, y: heightAt(x, z), z }
  })
}

// A 512×512 occupancy mask over the unit square marking roads and water, so
// trees never grow through either.
function buildMask(geo, metres) {
  const N = 512
  const mask = new Uint8Array(N * N)
  const cw = metres.width / N
  const ch = metres.height / N
  const buffer = 12 // metres of clearance around road centrelines

  for (const road of geo.roads) {
    for (let i = 0; i < road.p.length - 1; i++) {
      const [au, av] = road.p[i]
      const [bu, bv] = road.p[i + 1]
      const minU = Math.min(au, bu) - buffer / metres.width
      const maxU = Math.max(au, bu) + buffer / metres.width
      const minV = Math.min(av, bv) - buffer / metres.height
      const maxV = Math.max(av, bv) + buffer / metres.height
      const i0 = Math.max(0, Math.floor(minU * N))
      const i1 = Math.min(N - 1, Math.ceil(maxU * N))
      const j0 = Math.max(0, Math.floor(minV * N))
      const j1 = Math.min(N - 1, Math.ceil(maxV * N))
      for (let j = j0; j <= j1; j++) {
        for (let k = i0; k <= i1; k++) {
          const px = ((k + 0.5) / N) * metres.width
          const py = ((j + 0.5) / N) * metres.height
          const d = pointSegmentDistance(
            px,
            py,
            au * metres.width,
            av * metres.height,
            bu * metres.width,
            bv * metres.height
          )
          if (d < buffer) mask[j * N + k] = 1
        }
      }
    }
  }

  for (const water of geo.water) {
    if (water.k !== 'area' || water.p.length < 3) continue
    const b = polygonBounds(water.p)
    const i0 = Math.max(0, Math.floor(b.minX * N))
    const i1 = Math.min(N - 1, Math.ceil(b.maxX * N))
    const j0 = Math.max(0, Math.floor(b.minY * N))
    const j1 = Math.min(N - 1, Math.ceil(b.maxY * N))
    for (let j = j0; j <= j1; j++) {
      for (let k = i0; k <= i1; k++) {
        if (pointInPolygon((k + 0.5) / N, (j + 0.5) / N, water.p)) {
          mask[j * N + k] = 1
        }
      }
    }
  }

  return {
    blocked(u, v) {
      const k = Math.max(0, Math.min(N - 1, Math.floor(u * N)))
      const j = Math.max(0, Math.min(N - 1, Math.floor(v * N)))
      return mask[j * N + k] === 1
    },
  }
}

function buildRoads(geo, metres, heightAt) {
  const ribbons = makeRibbonAccumulator()
  for (const road of geo.roads) {
    const style = ROAD_STYLE[road.c] || ROAD_DEFAULT
    ribbons.add(toWorldPoints(road.p, metres, heightAt), style.width, style.color, 0.3)
  }
  return ribbons.build('roads')
}

function buildWater(geo, metres, heightAt) {
  const positions = []
  const color = new THREE.Color('#102233')
  const colors = []
  for (const water of geo.water) {
    if (water.k !== 'area' || water.p.length < 3) continue
    const pts = water.p.map(([u, v]) => {
      const { x, z } = unitToWorld(u, v, metres)
      return new THREE.Vector2(x, z)
    })
    let level = Infinity
    for (const pt of pts) level = Math.min(level, heightAt(pt.x, pt.y))
    level += 0.25
    let triangles
    try {
      triangles = THREE.ShapeUtils.triangulateShape(pts, [])
    } catch {
      continue
    }
    for (const tri of triangles) {
      for (const idx of tri) {
        positions.push(pts[idx].x, level, pts[idx].y)
        colors.push(color.r, color.g, color.b)
      }
    }
  }
  const streams = makeRibbonAccumulator()
  for (const water of geo.water) {
    if (water.k === 'area' || water.p.length < 2) continue
    streams.add(toWorldPoints(water.p, metres, heightAt), 2.5, '#0c1a24', 0.15)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(positions), 3)
  )
  geometry.setAttribute(
    'color',
    new THREE.BufferAttribute(new Float32Array(colors), 3)
  )
  const normals = new Float32Array(positions.length)
  for (let i = 0; i < normals.length; i += 3) normals[i + 1] = 1
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
  const mesh = new THREE.Mesh(
    geometry,
    lambert({
      vertexColors: true,
      emissive: new THREE.Color('#03121f'),
      side: THREE.DoubleSide,
    })
  )
  mesh.name = 'water'

  const group = new THREE.Group()
  group.add(mesh)
  group.add(streams.build('streams'))
  return group
}

// Two-octave value noise so the woods gather into stands instead of a uniform
// sprinkle; Bull Valley is oak groves between open fields.
function woodsNoise(u, v) {
  const hash = (ix, iy) => {
    const s = Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453
    return s - Math.floor(s)
  }
  const value = (x, y) => {
    const ix = Math.floor(x)
    const iy = Math.floor(y)
    const fx = x - ix
    const fy = y - iy
    const sx = fx * fx * (3 - 2 * fx)
    const sy = fy * fy * (3 - 2 * fy)
    return (
      hash(ix, iy) * (1 - sx) * (1 - sy) +
      hash(ix + 1, iy) * sx * (1 - sy) +
      hash(ix, iy + 1) * (1 - sx) * sy +
      hash(ix + 1, iy + 1) * sx * sy
    )
  }
  return value(u * 13, v * 13) * 0.65 + value(u * 31 + 7, v * 31 + 3) * 0.35
}

function buildTrees(geo, metres, heightAt, mask, rng) {
  const candidates = []
  const CAP = 26000
  // Clustered scatter: dense inside the noise's stands, a thin sprinkle of
  // lone trees in the open.
  for (let i = 0; i < 120000 && candidates.length < CAP; i++) {
    const u = rng()
    const v = rng()
    if (mask.blocked(u, v)) continue
    if (woodsNoise(u, v) < 0.52 && rng() > 0.05) continue
    candidates.push([u, v])
  }
  // Denser stands inside the nature reserves.
  for (const reserve of geo.reserves) {
    const b = polygonBounds(reserve.p)
    for (let i = 0; i < 500 && candidates.length < CAP; i++) {
      const u = range(rng, b.minX, b.maxX)
      const v = range(rng, b.minY, b.maxY)
      if (!pointInPolygon(u, v, reserve.p)) continue
      if (mask.blocked(u, v)) continue
      candidates.push([u, v])
    }
  }

  const count = candidates.length
  const trunkGeo = new THREE.CylinderGeometry(0.15, 0.3, 1, 5)
  trunkGeo.translate(0, 0.5, 0)
  const canopyGeo = new THREE.ConeGeometry(1, 1, 6)
  canopyGeo.translate(0, 0.5, 0)
  const trunks = new THREE.InstancedMesh(
    trunkGeo,
    lambert({ color: '#33271a' }),
    count
  )
  const canopies = new THREE.InstancedMesh(
    canopyGeo,
    lambert({ color: '#ffffff' }),
    count
  )
  const dummy = new THREE.Object3D()
  const canopyLow = new THREE.Color('#1c2f1e')
  const canopyHigh = new THREE.Color('#31482a')
  const tint = new THREE.Color()
  for (let i = 0; i < count; i++) {
    const [u, v] = candidates[i]
    const { x, z } = unitToWorld(u, v, metres)
    const y = heightAt(x, z)
    const trunkH = range(rng, 2.2, 4.2)
    const canopyH = range(rng, 4, 8)
    const canopyR = range(rng, 1.5, 3)
    dummy.position.set(x, y, z)
    dummy.rotation.set(0, rng() * Math.PI * 2, 0)
    dummy.scale.set(1, trunkH, 1)
    dummy.updateMatrix()
    trunks.setMatrixAt(i, dummy.matrix)
    dummy.position.set(x, y + trunkH * 0.8, z)
    dummy.scale.set(canopyR, canopyH, canopyR)
    dummy.updateMatrix()
    canopies.setMatrixAt(i, dummy.matrix)
    canopies.setColorAt(i, tint.copy(canopyLow).lerp(canopyHigh, rng()))
  }
  trunks.instanceMatrix.needsUpdate = true
  canopies.instanceMatrix.needsUpdate = true
  if (canopies.instanceColor) canopies.instanceColor.needsUpdate = true

  const group = new THREE.Group()
  group.add(trunks)
  group.add(canopies)
  group.name = 'trees'
  return group
}

// Utility poles pace the named roads — rural Illinois telegraphy.
function buildPoles(geo, metres, heightAt, rng) {
  const POLE_ROADS = new Set([
    'primary',
    'secondary',
    'tertiary',
    'residential',
    'unclassified',
  ])
  const SPACING = 130
  const spots = []
  for (const road of geo.roads) {
    if (!POLE_ROADS.has(road.c) || !road.n) continue
    let carry = rng() * SPACING
    for (let i = 0; i < road.p.length - 1 && spots.length < 1600; i++) {
      const a = unitToWorld(road.p[i][0], road.p[i][1], metres)
      const b = unitToWorld(road.p[i + 1][0], road.p[i + 1][1], metres)
      const dx = b.x - a.x
      const dz = b.z - a.z
      const len = Math.hypot(dx, dz)
      if (len === 0) continue
      while (carry < len) {
        const t = carry / len
        // Offset to the right of travel so poles sit off the shoulder.
        spots.push({
          x: a.x + dx * t - (dz / len) * 6.5,
          z: a.z + dz * t + (dx / len) * 6.5,
        })
        carry += SPACING
      }
      carry -= len
    }
  }

  const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 1, 5)
  poleGeo.translate(0, 0.5, 0)
  const armGeo = new THREE.BoxGeometry(1.7, 0.14, 0.14)
  const poles = new THREE.InstancedMesh(
    poleGeo,
    lambert({ color: '#3a2f22' }),
    spots.length
  )
  const arms = new THREE.InstancedMesh(
    armGeo,
    lambert({ color: '#33291d' }),
    spots.length
  )
  const dummy = new THREE.Object3D()
  for (let i = 0; i < spots.length; i++) {
    const { x, z } = spots[i]
    const y = heightAt(x, z)
    const h = range(rng, 8, 9.5)
    const yaw = rng() * Math.PI * 2
    dummy.position.set(x, y, z)
    dummy.rotation.set(0, yaw, range(rng, -0.03, 0.03))
    dummy.scale.set(1, h, 1)
    dummy.updateMatrix()
    poles.setMatrixAt(i, dummy.matrix)
    dummy.position.set(x, y + h - 0.9, z)
    dummy.scale.setScalar(1)
    dummy.updateMatrix()
    arms.setMatrixAt(i, dummy.matrix)
  }
  poles.instanceMatrix.needsUpdate = true
  arms.instanceMatrix.needsUpdate = true
  const group = new THREE.Group()
  group.name = 'poles'
  group.add(poles)
  group.add(arms)
  return group
}

function buildReeds(geo, metres, heightAt, rng) {
  const spots = []
  for (const wetland of geo.wetland) {
    if (wetland.length < 3) continue
    const b = polygonBounds(wetland)
    for (let i = 0; i < 40; i++) {
      const u = range(rng, b.minX, b.maxX)
      const v = range(rng, b.minY, b.maxY)
      if (pointInPolygon(u, v, wetland)) spots.push([u, v])
    }
  }
  const count = spots.length
  const geo3 = new THREE.CylinderGeometry(0.02, 0.05, 1, 3)
  geo3.translate(0, 0.5, 0)
  const reeds = new THREE.InstancedMesh(
    geo3,
    lambert({ color: '#2b301b' }),
    count
  )
  const dummy = new THREE.Object3D()
  for (let i = 0; i < count; i++) {
    const [u, v] = spots[i]
    const { x, z } = unitToWorld(u, v, metres)
    dummy.position.set(x, heightAt(x, z), z)
    dummy.rotation.set(range(rng, -0.12, 0.12), 0, range(rng, -0.12, 0.12))
    dummy.scale.set(1, range(rng, 1, 2), 1)
    dummy.updateMatrix()
    reeds.setMatrixAt(i, dummy.matrix)
  }
  reeds.instanceMatrix.needsUpdate = true
  reeds.name = 'reeds'
  return reeds
}

function buildGraveyards(geo, metres, heightAt, rng) {
  const group = new THREE.Group()
  group.name = 'graveyards'
  const anchors = []
  const stones = []
  for (const yard of geo.graveyards) {
    const { x, z } = unitToWorld(yard.c[0], yard.c[1], metres)
    anchors.push({ x, z, name: yard.n })
    const b = polygonBounds(yard.p)
    let placed = 0
    for (let i = 0; i < 90 && placed < 24; i++) {
      const u = range(rng, b.minX, b.maxX)
      const v = range(rng, b.minY, b.maxY)
      if (!pointInPolygon(u, v, yard.p)) continue
      stones.push([u, v])
      placed++
    }
    // Faint fence line at the property edge.
    const pts = yard.p.map(([u, v]) => {
      const w = unitToWorld(u, v, metres)
      return new THREE.Vector3(w.x, heightAt(w.x, w.z) + 0.7, w.z)
    })
    const fence = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({
        color: '#3a3f47',
        transparent: true,
        opacity: 0.4,
      })
    )
    group.add(fence)
  }

  const stoneGeo = new THREE.BoxGeometry(0.45, 0.85, 0.12)
  stoneGeo.translate(0, 0.425, 0)
  const mesh = new THREE.InstancedMesh(
    stoneGeo,
    lambert({ color: '#454b54' }),
    stones.length
  )
  const dummy = new THREE.Object3D()
  for (let i = 0; i < stones.length; i++) {
    const [u, v] = stones[i]
    const { x, z } = unitToWorld(u, v, metres)
    dummy.position.set(x, heightAt(x, z), z)
    dummy.rotation.set(
      range(rng, -0.06, 0.06),
      rng() * Math.PI * 2,
      range(rng, -0.08, 0.08)
    )
    dummy.scale.setScalar(range(rng, 0.8, 1.3))
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
  }
  mesh.instanceMatrix.needsUpdate = true
  group.add(mesh)
  return { group, anchors }
}

function makeGlowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30)
  grad.addColorStop(0, 'rgba(251, 191, 36, 0.65)')
  grad.addColorStop(1, 'rgba(251, 191, 36, 0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 64, 64)
  const texture = new THREE.CanvasTexture(canvas)
  return texture
}

function buildFuelStations(geo, metres, heightAt, rng) {
  const group = new THREE.Group()
  group.name = 'fuel'
  const stations = geo.fuel.filter(
    (f) =>
      f.p[0] > 0.015 && f.p[0] < 0.985 && f.p[1] > 0.015 && f.p[1] < 0.985
  )
  const count = stations.length
  const kioskGeo = new THREE.BoxGeometry(6, 3.2, 4.5)
  kioskGeo.translate(0, 1.6, 0)
  const signGeo = new THREE.BoxGeometry(1.8, 0.9, 0.15)
  const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, 4.5, 5)
  poleGeo.translate(0, 2.25, 0)
  const kiosks = new THREE.InstancedMesh(
    kioskGeo,
    lambert({ color: '#15181d' }),
    count
  )
  const poles = new THREE.InstancedMesh(
    poleGeo,
    lambert({ color: '#20242a' }),
    count
  )
  const signs = new THREE.InstancedMesh(
    signGeo,
    lambert({
      color: '#241a05',
      emissive: new THREE.Color('#fbbf24'),
      emissiveIntensity: 0.85,
    }),
    count
  )
  const glow = makeGlowTexture()
  const dummy = new THREE.Object3D()
  const points = []
  for (let i = 0; i < count; i++) {
    const { x, z } = unitToWorld(stations[i].p[0], stations[i].p[1], metres)
    const y = heightAt(x, z)
    const yaw = rng() * Math.PI * 2
    points.push({ x, z, name: stations[i].n })
    dummy.position.set(x, y, z)
    dummy.rotation.set(0, yaw, 0)
    dummy.scale.setScalar(1)
    dummy.updateMatrix()
    kiosks.setMatrixAt(i, dummy.matrix)
    const px = x + Math.cos(yaw) * 6
    const pz = z + Math.sin(yaw) * 6
    dummy.position.set(px, heightAt(px, pz), pz)
    dummy.updateMatrix()
    poles.setMatrixAt(i, dummy.matrix)
    dummy.position.set(px, heightAt(px, pz) + 4.2, pz)
    dummy.updateMatrix()
    signs.setMatrixAt(i, dummy.matrix)
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glow,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
      })
    )
    sprite.position.set(px, heightAt(px, pz) + 4.2, pz)
    sprite.scale.setScalar(7)
    group.add(sprite)
  }
  kiosks.instanceMatrix.needsUpdate = true
  poles.instanceMatrix.needsUpdate = true
  signs.instanceMatrix.needsUpdate = true
  group.add(kiosks)
  group.add(poles)
  group.add(signs)
  return { group, points }
}

function buildBoundary(geo, metres, heightAt) {
  const group = new THREE.Group()
  group.name = 'boundary'
  for (const ring of geo.boundary) {
    const pts = ring.map(([u, v]) => {
      const { x, z } = unitToWorld(u, v, metres)
      return new THREE.Vector3(x, heightAt(x, z) + 0.6, z)
    })
    group.add(
      new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({
          color: '#f59e0b',
          transparent: true,
          opacity: 0.45,
        })
      )
    )
  }
  return group
}

function makePickupMesh(kind) {
  const geo3 = new THREE.BoxGeometry(0.5, 0.35, 0.35)
  geo3.translate(0, 0.4, 0)
  const emissive = kind === 'cigarettes' ? '#fbbf24' : '#4ade80'
  return new THREE.Mesh(
    geo3,
    new THREE.MeshLambertMaterial({
      color: '#101216',
      emissive: new THREE.Color(emissive),
      emissiveIntensity: 0.5,
    })
  )
}

function buildPickups(geo, metres, heightAt, fuelPoints, rng) {
  const group = new THREE.Group()
  group.name = 'pickups'
  const pickups = []
  const place = (x, z, kind, count) => {
    const mesh = makePickupMesh(kind)
    mesh.position.set(x, heightAt(x, z), z)
    group.add(mesh)
    pickups.push({ kind, count, mesh, x, z, taken: false })
  }
  // Cigarettes wait at every fuel station inside the survey square.
  for (const station of fuelPoints) {
    place(
      station.x + range(rng, -4, 4),
      station.z + range(rng, -4, 4),
      'cigarettes',
      3
    )
  }
  // Weed grows where nobody mows: the reserves and the wetland edges.
  for (const reserve of geo.reserves) {
    const b = polygonBounds(reserve.p)
    for (let i = 0; i < 30; i++) {
      const u = range(rng, b.minX, b.maxX)
      const v = range(rng, b.minY, b.maxY)
      if (!pointInPolygon(u, v, reserve.p)) continue
      const { x, z } = unitToWorld(u, v, metres)
      place(x, z, 'joints', 2)
      break
    }
  }
  for (let i = 0; i < geo.wetland.length && i < 6; i++) {
    const wetland = geo.wetland[i]
    if (wetland.length < 3) continue
    const [u, v] = wetland[Math.floor(rng() * wetland.length)]
    const { x, z } = unitToWorld(u, v, metres)
    place(x, z, 'joints', 2)
  }
  return { group, pickups }
}

function findSpawn(geo, metres, heightAt) {
  let best = null
  for (const road of geo.roads) {
    if (!/bull valley/i.test(road.n || '')) continue
    if (!best || road.p.length > best.p.length) best = road
  }
  const pts = best ? best.p : [[0.5, 0.5], [0.51, 0.5]]
  const mid = Math.floor(pts.length / 2)
  const a = unitToWorld(pts[mid][0], pts[mid][1], metres)
  const b = unitToWorld(
    pts[Math.min(pts.length - 1, mid + 1)][0],
    pts[Math.min(pts.length - 1, mid + 1)][1],
    metres
  )
  return { x: a.x, z: a.z, yaw: Math.atan2(-(b.x - a.x), -(b.z - a.z)) }
}

export function buildWorld(geo, heightAt) {
  const metres = geo.metres
  const rng = mulberry32(0x5cad0)
  const mask = buildMask(geo, metres)
  const group = new THREE.Group()
  group.name = 'bull-valley'

  group.add(buildRoads(geo, metres, heightAt))
  group.add(buildWater(geo, metres, heightAt))
  group.add(buildTrees(geo, metres, heightAt, mask, rng))
  group.add(buildPoles(geo, metres, heightAt, rng))
  group.add(buildReeds(geo, metres, heightAt, rng))
  const graveyards = buildGraveyards(geo, metres, heightAt, rng)
  group.add(graveyards.group)
  const fuel = buildFuelStations(geo, metres, heightAt, rng)
  group.add(fuel.group)
  group.add(buildBoundary(geo, metres, heightAt))
  const pickupSet = buildPickups(geo, metres, heightAt, fuel.points, rng)
  group.add(pickupSet.group)

  return {
    group,
    pickups: pickupSet.pickups,
    graveAnchors: graveyards.anchors,
    fuelPoints: fuel.points,
    spawn: findSpawn(geo, metres, heightAt),
  }
}
