import * as THREE from 'three'

// The PS1 vertex wobble: clip-space positions snapped to a coarse grid, so
// geometry shivers as the camera moves. Every world material passes through
// applyPS1; the shared snap vector is mutated on resize so all shaders follow.

const snap = new THREE.Vector2(160, 120)

export function setSnapResolution(width, height) {
  // Half the internal render resolution reads as classic hardware; full
  // resolution barely wobbles at all.
  snap.set(Math.max(64, width / 2), Math.max(48, height / 2))
}

export function applyPS1(material) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uGsSnap = { value: snap }
    shader.vertexShader =
      'uniform vec2 uGsSnap;\n' +
      shader.vertexShader.replace(
        '#include <project_vertex>',
        [
          '#include <project_vertex>',
          'float gsW = gl_Position.w;',
          'if (abs(gsW) > 1e-5) {',
          '  gl_Position.xy = floor(gl_Position.xy / gsW * uGsSnap) / uGsSnap * gsW;',
          '}',
        ].join('\n')
      )
  }
  material.needsUpdate = true
  return material
}
