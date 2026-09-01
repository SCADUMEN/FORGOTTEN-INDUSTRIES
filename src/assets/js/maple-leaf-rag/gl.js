// WebGL2 renderer for MAPLE LEAF RAG ZONE. Forked from ZOOT's gl.js
// (src/assets/js/zoot/gl.js): same photo cross-fade machinery, but no text
// texture and no pointer-impulse uniforms — this zone is image + slick only.

import { VERT, fragmentSource } from './shaders.js'

// Warm maple palette, normalized. uPalette[0] deep red (#b3121f), [1] ember
// orange (#e8641e), [2] maple gold (#f2a900). The shader weights these by the
// three thin-film channel responses.
const PALETTE = new Float32Array([
  0.702, 0.071, 0.122, 0.91, 0.392, 0.118, 0.949, 0.663, 0.0,
])

const UNIFORMS = [
  'uResolution',
  'uTime',
  'uThickness',
  'uPhase',
  'uDrift',
  'uPalette',
  'uGrainSeed',
  'uPhotoA',
  'uPhotoB',
  'uPhotoScaleA',
  'uPhotoScaleB',
  'uPhotoMix',
  'uPhotoAmount',
  'uPhotoC',
  'uPhotoD',
  'uPhotoScaleC',
  'uPhotoScaleD',
  'uPhotoMix2',
  'uPhotoAmount2',
]

// A 1x1 transparent black texel so the photo samplers always resolve even
// before any photograph loads (uPhotoAmount/uPhotoAmount2 gate the visual).
const BLANK_TEXEL = new Uint8Array([0, 0, 0, 0])
const NO_PHOTO = {
  mix: 0,
  amount: 0,
  scaleA: [1, 1],
  scaleB: [1, 1],
  mix2: 0,
  amount2: 0,
  scaleC: [1, 1],
  scaleD: [1, 1],
}

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
    console.error('[maple-leaf-rag] shader build failed:', err)
    return null
  }
  let active = programs.high

  const vao = gl.createVertexArray()
  gl.bindVertexArray(vao)

  // Photo texture units 1-4: slots 0/1 are the base layer's cross-fade pair
  // (A/B), slots 2/3 the second pair (C/D, unused by this zone but wired for
  // parity with the shared photos.js). NPOT-safe: LINEAR + CLAMP, no mipmaps.
  const makePhotoTex = () => {
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
      BLANK_TEXEL
    )
    return tex
  }
  const photoTex = [
    makePhotoTex(),
    makePhotoTex(),
    makePhotoTex(),
    makePhotoTex(),
  ]

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

    // Upload a decoded photograph into a texture slot: 0/1 = base A/B,
    // 2/3 = second pair C/D. Called off the hot path — once per cross-fade.
    uploadPhoto(slot, image) {
      gl.bindTexture(gl.TEXTURE_2D, photoTex[slot])
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
    },

    draw(state) {
      gl.useProgram(active.program)
      const u = active.uniforms
      gl.uniform2f(u.uResolution, canvas.width, canvas.height)
      gl.uniform1f(u.uTime, state.time)
      gl.uniform1f(u.uThickness, state.thickness)
      gl.uniform1f(u.uPhase, state.phase)
      gl.uniform2f(u.uDrift, state.drift[0], state.drift[1])
      gl.uniform3fv(u.uPalette, PALETTE)
      gl.uniform1f(u.uGrainSeed, state.grainSeed)
      const photo = state.photo || NO_PHOTO
      gl.uniform1f(u.uPhotoMix, photo.mix)
      gl.uniform1f(u.uPhotoAmount, photo.amount)
      gl.uniform2f(u.uPhotoScaleA, photo.scaleA[0], photo.scaleA[1])
      gl.uniform2f(u.uPhotoScaleB, photo.scaleB[0], photo.scaleB[1])
      gl.uniform1f(u.uPhotoMix2, photo.mix2)
      gl.uniform1f(u.uPhotoAmount2, photo.amount2)
      gl.uniform2f(u.uPhotoScaleC, photo.scaleC[0], photo.scaleC[1])
      gl.uniform2f(u.uPhotoScaleD, photo.scaleD[0], photo.scaleD[1])
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, photoTex[0])
      gl.uniform1i(u.uPhotoA, 1)
      gl.activeTexture(gl.TEXTURE2)
      gl.bindTexture(gl.TEXTURE_2D, photoTex[1])
      gl.uniform1i(u.uPhotoB, 2)
      gl.activeTexture(gl.TEXTURE3)
      gl.bindTexture(gl.TEXTURE_2D, photoTex[2])
      gl.uniform1i(u.uPhotoC, 3)
      gl.activeTexture(gl.TEXTURE4)
      gl.bindTexture(gl.TEXTURE_2D, photoTex[3])
      gl.uniform1i(u.uPhotoD, 4)
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
