import * as THREE from 'three'
import { bilinearHeight } from './coords.js'
import { applyPS1 } from './ps1.js'

// The same heightmap the Scaduscope reads: 512×512, 16 bits of normalized
// elevation packed as R (high byte) + G (low byte), range in geo.json.terrain.
// See scripts/fetch_bull_valley.cjs.
export async function loadTerrain(url) {
  const img = await new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Terrain image failed to load: ${url}`))
    image.src = url
  })
  const size = img.width
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0)
  const { data } = ctx.getImageData(0, 0, size, size)
  const heights = new Float32Array(size * size)
  for (let k = 0; k < heights.length; k++) {
    heights[k] = (data[k * 4] * 256 + data[k * 4 + 1]) / 65535
  }
  return { heights, size }
}

// The playable height field, in metres of relief above the valley floor.
//
// Everything — the terrain mesh, the player's feet, road ribbons, trees,
// shadowmen — samples THIS grid, which is the 512 heightmap decimated to the
// mesh resolution. If features sampled the full-resolution map instead, they
// would sink below or float above the rendered surface wherever the two
// disagree (the classic draping bug).
export function createHeightField(terrain, geo, seg = 240) {
  const n = seg + 1
  const relief = geo.terrain.max - geo.terrain.min
  const grid = new Float32Array(n * n)
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      grid[j * n + i] =
        bilinearHeight(terrain.heights, terrain.size, i / seg, j / seg) * relief
    }
  }
  const { width, height } = geo.metres
  return {
    seg,
    n,
    grid,
    relief,
    sample(x, z) {
      const u = Math.max(0, Math.min(1, x / width + 0.5))
      const v = Math.max(0, Math.min(1, z / height + 0.5))
      return bilinearHeight(grid, n, u, v)
    },
  }
}

export function buildTerrainMesh(field, geo) {
  const { seg, n, grid, relief } = field
  const { width, height } = geo.metres
  const verts = n * n
  const positions = new Float32Array(verts * 3)
  const colors = new Float32Array(verts * 3)
  const indices = new Uint32Array(seg * seg * 6)

  // Night ground: dark olive lowlands rising to grey-green knolls, with a
  // little hashed variation so the lambert shading has texture to bite.
  const low = new THREE.Color('#26311d')
  const high = new THREE.Color('#4d5a3b')
  const tmp = new THREE.Color()

  let p = 0
  for (let j = 0; j < n; j++) {
    const v = j / seg
    for (let i = 0; i < n; i++) {
      const u = i / seg
      const h = grid[j * n + i]
      positions[p * 3] = (u - 0.5) * width
      positions[p * 3 + 1] = h
      positions[p * 3 + 2] = (v - 0.5) * height
      // Cheap deterministic hash per vertex for tonal grain.
      const nn = Math.sin(i * 127.1 + j * 311.7) * 43758.5453
      const grain = (nn - Math.floor(nn) - 0.5) * 0.16
      tmp.copy(low).lerp(high, Math.min(1, Math.max(0, h / relief + grain)))
      colors[p * 3] = tmp.r
      colors[p * 3 + 1] = tmp.g
      colors[p * 3 + 2] = tmp.b
      p++
    }
  }

  let q = 0
  for (let j = 0; j < seg; j++) {
    for (let i = 0; i < seg; i++) {
      const a = j * n + i
      const b = a + 1
      const c = a + n
      const d = c + 1
      indices[q++] = a
      indices[q++] = c
      indices[q++] = b
      indices[q++] = b
      indices[q++] = c
      indices[q++] = d
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setIndex(new THREE.BufferAttribute(indices, 1))
  geometry.computeVertexNormals()

  const material = applyPS1(
    new THREE.MeshLambertMaterial({ vertexColors: true })
  )
  const mesh = new THREE.Mesh(geometry, material)
  mesh.name = 'terrain'
  return mesh
}
