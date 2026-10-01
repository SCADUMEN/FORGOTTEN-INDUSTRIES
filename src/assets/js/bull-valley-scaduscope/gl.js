// WebGL2 renderer for BULL VALLEY SCADUSCOPE. Same shape as MAPLE LEAF RAG
// ZONE's gl.js (src/assets/js/maple-leaf-rag/gl.js): a full-screen triangle,
// high/low programs for the one-way adaptive degrade, and a context-loss-safe
// factory. The textures differ: a packed terrain heightmap and two layer
// textures rasterized by layers.js.

import { VERT, fragmentSource, MAX_HERDS } from './shaders.js'

const UNIFORMS = [
  'uResolution',
  'uTime',
  'uMapRect',
  'uMetres',
  'uElev',
  'uHigh',
  'uDark',
  'uSun',
  'uMoon',
  'uMoonLight',
  'uCloud',
  'uFog',
  'uWet',
  'uWind',
  'uTraffic',
  'uWitching',
  'uGrainSeed',
  'uSweep',
  'uRadar',
  'uRadarOn',
  'uPulse',
  'uPulseTint',
  'uHerdCount',
  'uHerds',
  'uTerrain',
  'uLayersA',
  'uLayersB',
]

export function createRenderer(canvas) {
  const gl = canvas.getContext('webgl2', {
    antialias: false,
    alpha: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance',
  })
  if (!gl) return null

  let programs
  try {
    programs = {
      high: buildProgram(gl, VERT, fragmentSource(4)),
      low: buildProgram(gl, VERT, fragmentSource(2)),
    }
  } catch (err) {
    console.error('[scaduscope] shader build failed:', err)
    return null
  }
  let active = programs.high

  const vao = gl.createVertexArray()
  gl.bindVertexArray(vao)

  const makeTex = () => {
    const tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array(4)
    )
    return tex
  }
  const textures = {
    terrain: makeTex(),
    layersA: makeTex(),
    layersB: makeTex(),
  }
  const herdBuffer = new Float32Array(MAX_HERDS * 4)

  return {
    gl,

    setQuality(level) {
      active = programs[level] || programs.high
    },

    resize(cssWidth, cssHeight, scale) {
      canvas.width = Math.max(1, Math.round(cssWidth * scale))
      canvas.height = Math.max(1, Math.round(cssHeight * scale))
      gl.viewport(0, 0, canvas.width, canvas.height)
    },

    // Terrain: a decoded image. The packed height must survive intact, so no
    // colorspace conversion or premultiplication on the way in, and NEAREST
    // would band — LINEAR on the packed bytes is close enough at 512².
    uploadTerrain(image) {
      gl.bindTexture(gl.TEXTURE_2D, textures.terrain)
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE)
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
    },

    // Layers: raw RGBA bytes from layers.js, `size` pixels square.
    uploadLayers(which, bytes, size) {
      gl.bindTexture(gl.TEXTURE_2D, textures[which])
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        size,
        size,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        bytes
      )
    },

    draw(s) {
      gl.useProgram(active.program)
      const u = active.uniforms
      gl.uniform2f(u.uResolution, canvas.width, canvas.height)
      gl.uniform1f(u.uTime, s.time)
      gl.uniform4fv(u.uMapRect, s.mapRect)
      gl.uniform2fv(u.uMetres, s.metres)
      gl.uniform2fv(u.uElev, s.elev)
      gl.uniform1f(u.uHigh, s.high)
      gl.uniform1f(u.uDark, s.dark)
      gl.uniform3fv(u.uSun, s.sun)
      gl.uniform3fv(u.uMoon, s.moon)
      gl.uniform1f(u.uMoonLight, s.moonLight)
      gl.uniform1f(u.uCloud, s.cloud)
      gl.uniform1f(u.uFog, s.fog)
      gl.uniform1f(u.uWet, s.wet)
      gl.uniform2fv(u.uWind, s.wind)
      gl.uniform1f(u.uTraffic, s.traffic)
      gl.uniform1f(u.uWitching, s.witching)
      gl.uniform1f(u.uGrainSeed, s.grainSeed)
      gl.uniform1f(u.uSweep, s.sweep)
      gl.uniform4fv(u.uRadar, s.radar)
      gl.uniform1f(u.uRadarOn, s.radarOn)
      gl.uniform1f(u.uPulse, s.pulse)
      gl.uniform1f(u.uPulseTint, s.pulseTint)

      const count = Math.min(MAX_HERDS, s.herds.length)
      for (let i = 0; i < count; i++) herdBuffer.set(s.herds[i], i * 4)
      gl.uniform1i(u.uHerdCount, count)
      gl.uniform4fv(u.uHerds, herdBuffer)

      bind(gl, 0, textures.terrain, u.uTerrain)
      bind(gl, 1, textures.layersA, u.uLayersA)
      bind(gl, 2, textures.layersB, u.uLayersB)
      gl.bindVertexArray(vao)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },
  }
}

function bind(gl, unit, tex, location) {
  gl.activeTexture(gl.TEXTURE0 + unit)
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.uniform1i(location, unit)
}

function buildProgram(gl, vertSrc, fragSrc) {
  const program = gl.createProgram()
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertSrc))
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragSrc))
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`program link failed: ${gl.getProgramInfoLog(program)}`)
  }
  const uniforms = {}
  for (const name of UNIFORMS) {
    uniforms[name] = gl.getUniformLocation(program, name)
  }
  return { program, uniforms }
}

function compile(gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(`shader compile failed: ${log}`)
  }
  return shader
}
