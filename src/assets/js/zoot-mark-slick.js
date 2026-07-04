// Oil-slick bloom behind the footer fi mark (.fi-zoot-mark). A compact
// version of the ZOOT thin-film shader, masked to a soft blob, running only
// while the mark is hovered or focused. Progressive enhancement: without
// WebGL2 or with reduced motion the mark stays a plain link.
;(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const VERT = `#version 300 es
void main() {
  vec2 pos = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(pos * 2.0 - 1.0, 0.0, 1.0);
}
`

  const FRAG = `#version 300 es
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform float uFade;
uniform vec2 uMouse; // aspect-corrected UV
out vec4 outColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  mat2 rot = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 3; i++) {
    v += amp * vnoise(p);
    p = rot * p;
    amp *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float aspect = uResolution.x / uResolution.y;
  vec2 auv = uv * vec2(aspect, 1.0);
  vec2 p = auv * 3.4;

  // The pointer drags a swirl through the film.
  vec2 d = auv - uMouse;
  float dist = length(d);
  p += vec2(-d.y, d.x) / (dist + 0.2) * 0.35 * exp(-dist * dist * 5.0);

  vec2 q = vec2(fbm(p + uTime * 0.11), fbm(p + vec2(5.2, 1.3) - uTime * 0.09));
  vec2 r = vec2(
    fbm(p + 2.0 * q + vec2(1.7, 9.2) + uTime * 0.13),
    fbm(p + 2.0 * q + vec2(8.3, 2.8) + uTime * 0.12)
  );
  float h = fbm(p + 2.4 * r);

  float opd = h * 1.15 + uTime * 0.22;
  vec3 col = 0.5 + 0.5 * cos(opd * vec3(1.0 / 0.65, 1.0 / 0.55, 1.0 / 0.45) * 12.0 + vec3(0.0, 0.6, 1.0));
  float luma = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(luma), col, 1.5);
  col *= pow(clamp(h, 0.0, 1.0), 1.4) * 1.9;

  // Soft blob mask so the bloom has no rectangular edge.
  vec2 c = uv - 0.5;
  c.x *= aspect;
  float mask = smoothstep(0.52, 0.14, length(c)) * (0.65 + 0.35 * h);
  float alpha = mask * uFade;
  outColor = vec4(col * alpha, alpha);
}
`

  function compile(gl, type, source) {
    const shader = gl.createShader(type)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader)
      gl.deleteShader(shader)
      throw new Error('zoot mark shader compile failed: ' + log)
    }
    return shader
  }

  function attach(mark) {
    const canvas = document.createElement('canvas')
    canvas.className = 'fi-zoot-slick-canvas'
    canvas.setAttribute('aria-hidden', 'true')
    mark.appendChild(canvas)

    let gl = null
    let uniforms = null
    let rafId = 0
    let fade = 0
    let fadeTarget = 0
    let mouse = [0.5, 0.5]
    let lastFrame = 0
    const start = performance.now()

    function init() {
      gl = canvas.getContext('webgl2', {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
      })
      if (!gl) return false
      try {
        const program = gl.createProgram()
        gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT))
        gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG))
        gl.linkProgram(program)
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
          throw new Error(gl.getProgramInfoLog(program))
        }
        gl.useProgram(program)
        gl.bindVertexArray(gl.createVertexArray())
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
        uniforms = {
          uResolution: gl.getUniformLocation(program, 'uResolution'),
          uTime: gl.getUniformLocation(program, 'uTime'),
          uFade: gl.getUniformLocation(program, 'uFade'),
          uMouse: gl.getUniformLocation(program, 'uMouse'),
        }
      } catch (err) {
        console.error('[zoot mark]', err)
        gl = null
        return false
      }
      return true
    }

    function resize() {
      const rect = mark.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.round(rect.height * 2.6)
      const h = Math.round(rect.height * 2.2)
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
      gl.viewport(0, 0, canvas.width, canvas.height)
    }

    function frame(now) {
      rafId = requestAnimationFrame(frame)
      const dt = Math.min(0.1, (now - lastFrame) / 1000)
      lastFrame = now
      fade += (fadeTarget - fade) * Math.min(1, dt * 5)
      if (fadeTarget === 0 && fade < 0.01) {
        cancelAnimationFrame(rafId)
        rafId = 0
        gl.clear(gl.COLOR_BUFFER_BIT)
        return
      }
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.uniform2f(uniforms.uResolution, canvas.width, canvas.height)
      gl.uniform1f(uniforms.uTime, (now - start) / 1000)
      gl.uniform1f(uniforms.uFade, fade)
      gl.uniform2f(uniforms.uMouse, mouse[0], mouse[1])
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    function wake() {
      if (!gl && !init()) return
      resize()
      fadeTarget = 1
      if (!rafId) {
        lastFrame = performance.now()
        rafId = requestAnimationFrame(frame)
      }
    }

    mark.addEventListener('pointerenter', wake)
    mark.addEventListener('focus', wake)
    mark.addEventListener('pointerleave', () => {
      fadeTarget = 0
    })
    mark.addEventListener('blur', () => {
      fadeTarget = 0
    })
    mark.addEventListener('pointermove', (event) => {
      const rect = canvas.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      const aspect = rect.width / rect.height
      mouse = [
        ((event.clientX - rect.left) / rect.width) * aspect,
        1 - (event.clientY - rect.top) / rect.height,
      ]
    })
  }

  const boot = () => document.querySelectorAll('.fi-zoot-mark').forEach(attach)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot)
  } else {
    boot()
  }
})()
