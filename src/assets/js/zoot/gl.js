// WebGL2 renderer for ZOOT: context, program variants, text texture, uniforms.

import { VERT, fragmentSource, MAX_IMPULSES, MAX_FRAGS } from './shaders.js'

// --fi-cyan, --fi-magenta, --fi-gold (src/css/archive.css), normalized.
const PALETTE = new Float32Array([
  0.133, 0.827, 0.933, 0.91, 0.475, 0.976, 0.961, 0.62, 0.043,
])

const UNIFORMS = [
  'uResolution',
  'uTime',
  'uImpulses',
  'uTextTex',
  'uFragRect',
  'uFragReveal',
  'uFragTint',
  'uFocusIndex',
  'uFocusAmount',
  'uThickness',
  'uPhase',
  'uDrift',
  'uPalette',
  'uGrainSeed',
]

export { MAX_IMPULSES, MAX_FRAGS }

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
      low: buildProgram(gl, VERT, fragmentSource(3)),
    }
  } catch (err) {
    console.error('[zoot] shader build failed:', err)
    return null
  }
  let active = programs.high

  const vao = gl.createVertexArray()
  gl.bindVertexArray(vao)

  const textTex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, textTex)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

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

    // Full-sheet upload; called only when a slot changes (every few seconds).
    uploadTextSheet(sheetCanvas) {
      gl.bindTexture(gl.TEXTURE_2D, textTex)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        sheetCanvas
      )
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
    },

    draw(state) {
      gl.useProgram(active.program)
      const u = active.uniforms
      gl.uniform2f(u.uResolution, canvas.width, canvas.height)
      gl.uniform1f(u.uTime, state.time)
      gl.uniform4fv(u.uImpulses, state.impulses)
      gl.uniform4fv(u.uFragRect, state.fragRects)
      gl.uniform1fv(u.uFragReveal, state.fragReveals)
      gl.uniform3fv(u.uFragTint, state.fragTints)
      gl.uniform1i(u.uFocusIndex, state.focusIndex)
      gl.uniform1f(u.uFocusAmount, state.focusAmount)
      gl.uniform1f(u.uThickness, state.thickness)
      gl.uniform1f(u.uPhase, state.phase)
      gl.uniform2f(u.uDrift, state.drift[0], state.drift[1])
      gl.uniform3fv(u.uPalette, PALETTE)
      gl.uniform1f(u.uGrainSeed, state.grainSeed)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, textTex)
      gl.uniform1i(u.uTextTex, 0)
      gl.bindVertexArray(vao)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },
  }
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
