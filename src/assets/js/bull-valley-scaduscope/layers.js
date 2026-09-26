// BULL VALLEY SCADUSCOPE layer rasterizer. Draws the vector layers from
// geo.json (scripts/fetch_bull_valley.cjs) once, at load, into two packed RGBA
// textures the shader reads:
//   layersA: R roads, G water, B wetland, A village boundary
//   layersB: R nature reserves, G graveyards, B traffic heat (log AADT)
// Each layer is drawn white-on-black into its own 2D canvas and its red channel
// copied into one byte of the packed buffer, which sidesteps canvas alpha
// premultiplication entirely.

export const LAYER_SIZE = 1536

const ROAD_WIDTH = {
  motorway: 4,
  trunk: 3.6,
  primary: 3.2,
  secondary: 2.6,
  tertiary: 2,
  unclassified: 1.4,
  residential: 1.2,
}
const MAX_AADT = 20000

export function rasterizeLayers(geo) {
  const S = LAYER_SIZE
  const canvas = document.createElement('canvas')
  canvas.width = S
  canvas.height = S
  const ctx = canvas.getContext('2d', { willReadFrequently: true })

  const layer = (draw) => {
    ctx.globalAlpha = 1
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, S, S)
    ctx.strokeStyle = '#fff'
    ctx.fillStyle = '#fff'
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    draw()
    const { data } = ctx.getImageData(0, 0, S, S)
    const out = new Uint8Array(S * S)
    for (let i = 0; i < out.length; i++) out[i] = data[i * 4]
    return out
  }

  const trace = (pts, close = false) => {
    ctx.beginPath()
    pts.forEach(([x, y], i) =>
      i ? ctx.lineTo(x * S, y * S) : ctx.moveTo(x * S, y * S)
    )
    if (close) ctx.closePath()
  }

  const roads = layer(() => {
    for (const r of geo.roads) {
      ctx.lineWidth = ROAD_WIDTH[r.c] || 1.2
      trace(r.p)
      ctx.stroke()
    }
  })

  const water = layer(() => {
    for (const w of geo.water) {
      trace(w.p, w.k === 'area')
      if (w.k === 'area') {
        ctx.fill()
      } else {
        ctx.lineWidth = 2
        ctx.stroke()
      }
    }
  })

  const wetland = layer(() => {
    for (const ring of geo.wetland) {
      trace(ring, true)
      ctx.fill()
    }
  })

  const boundary = layer(() => {
    ctx.lineWidth = 2.5
    for (const ring of geo.boundary) {
      trace(ring, true)
      ctx.stroke()
    }
  })

  const reserves = layer(() => {
    for (const r of geo.reserves) {
      trace(r.p, true)
      ctx.fill()
    }
  })

  const graveyards = layer(() => {
    for (const g of geo.graveyards) {
      if (g.p.length > 2) {
        trace(g.p, true)
        ctx.fill()
        ctx.lineWidth = 8
        ctx.globalAlpha = 0.5
        ctx.stroke()
        ctx.globalAlpha = 1
      } else {
        ctx.beginPath()
        ctx.arc(g.c[0] * S, g.c[1] * S, 8, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  })

  const heat = layer(() => {
    const logMax = Math.log10(MAX_AADT)
    for (const s of geo.traffic) {
      const v = Math.min(1, Math.log10(Math.max(10, s.v)) / logMax)
      ctx.globalAlpha = v
      ctx.lineWidth = 1.5 + 4 * v
      trace(s.p)
      ctx.stroke()
    }
  })

  return {
    size: S,
    layersA: pack(roads, water, wetland, boundary),
    layersB: pack(reserves, graveyards, heat, null),
  }
}

function pack(r, g, b, a) {
  const out = new Uint8Array(r.length * 4)
  for (let i = 0; i < r.length; i++) {
    out[i * 4] = r[i]
    out[i * 4 + 1] = g[i]
    out[i * 4 + 2] = b[i]
    out[i * 4 + 3] = a ? a[i] : 0
  }
  return out
}

// Terrain heights on the CPU (for the herds' ground-seeking), decoded from the
// same packed PNG the shader samples. Returns { size, at(x, y) -> 0..1 }.
export function decodeTerrain(image) {
  const size = image.naturalWidth
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = image.naturalHeight
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(image, 0, 0)
  const { data } = ctx.getImageData(0, 0, size, image.naturalHeight)
  const heights = new Float32Array(size * image.naturalHeight)
  for (let i = 0; i < heights.length; i++) {
    heights[i] = (data[i * 4] * 256 + data[i * 4 + 1]) / 65535
  }
  return {
    size,
    at(x, y) {
      const i = Math.min(size - 1, Math.max(0, Math.floor(x * size)))
      const j = Math.min(size - 1, Math.max(0, Math.floor(y * size)))
      return heights[j * size + i]
    },
  }
}
