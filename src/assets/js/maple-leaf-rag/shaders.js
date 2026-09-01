// GLSL ES 3.00 sources for MAPLE LEAF RAG. Forked from ZOOT's shaders.js
// (src/assets/js/zoot/shaders.js) and pared down: no text-fragment system and no
// pointer impulses — this zone is image + slick only, passive. Template literals
// instead of .glsl files: the site has no bundler and /assets is
// passthrough-copied verbatim.
//
// Differences from ZOOT: warm maple palette (set in gl.js via uPalette), and a
// slower, looser domain-warp with a gentle diagonal "leaf drift" advection.

export const VERT = `#version 300 es
void main() {
  vec2 pos = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(pos * 2.0 - 1.0, 0.0, 1.0);
}
`

// octaves: fbm octave count — 4 for the full look, 3 for the degraded
// mobile/slow-GPU variant. Compile-time so drivers can unroll.
export function fragmentSource(octaves) {
  return `#version 300 es
precision highp float;

#define OCTAVES ${octaves}

uniform vec2 uResolution;
uniform float uTime;
uniform float uThickness;
uniform float uPhase;
uniform vec2 uDrift;
uniform vec3 uPalette[3];             // maple red, ember, gold
uniform float uGrainSeed;
uniform sampler2D uPhotoA;            // base layer photographs, cross-faded
uniform sampler2D uPhotoB;
uniform vec2 uPhotoScaleA;            // cover-fit UV scale (viewport vs image aspect)
uniform vec2 uPhotoScaleB;
uniform float uPhotoMix;              // 0 = A, 1 = B
uniform float uPhotoAmount;           // base presence; 0 when no base photographs
uniform sampler2D uPhotoC;            // second cross-fade pair (unused here; gated off)
uniform sampler2D uPhotoD;
uniform vec2 uPhotoScaleC;
uniform vec2 uPhotoScaleD;
uniform float uPhotoMix2;             // 0 = C, 1 = D
uniform float uPhotoAmount2;          // overlay presence; 0 when no overlay photos

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
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  mat2 rot = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < OCTAVES; i++) {
    v += amp * vnoise(p);
    p = rot * p;
    amp *= 0.5;
  }
  return v;
}

// Cover-fit a photo into the viewport: scale about center so the shorter
// image axis fills, the longer overflows (object-fit: cover).
vec2 coverUV(vec2 uv, vec2 scale) {
  return (uv - 0.5) / scale + 0.5;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float aspect = uResolution.x / uResolution.y;
  // Larger, looser features than ZOOT (1.8 vs 2.2), plus a slow diagonal
  // advection so the whole field drifts down and aside like a settling leaf.
  vec2 p = uv * vec2(aspect, 1.0) * 1.8;
  p += uTime * vec2(0.010, -0.006);

  // Domain-warped fbm: the double warp produces the churning marble. Slowed
  // (0.022) and widened (2.6 / 2.8 warp gains) for a looser flow.
  float t = uTime * 0.022;
  vec2 q = vec2(
    fbm(p + t * uDrift),
    fbm(p + vec2(5.2, 1.3) + t * uDrift)
  );
  vec2 r = vec2(
    fbm(p + 2.6 * q + vec2(1.7, 9.2) + uTime * 0.014),
    fbm(p + 2.6 * q + vec2(8.3, 2.8) + uTime * 0.012)
  );
  float h = fbm(p + 2.8 * r);

  // Thin-film interference across three wavelengths. Broader bands (9.0 vs
  // 12.0) read softer under the warm palette.
  float opd = h * uThickness + uPhase;
  vec3 film = 0.5 + 0.5 * cos(opd * vec3(1.0 / 0.65, 1.0 / 0.55, 1.0 / 0.45) * 9.0 + vec3(0.0, 0.6, 1.0));

  // Grade toward the house palette, weighted by channel response.
  vec3 pal = film.g * uPalette[0] + film.r * uPalette[1] + film.b * uPalette[2];
  pal /= max(film.r + film.g + film.b, 1e-3);
  vec3 col = mix(film, pal, 0.7);

  // Troughs fall to black; the slick sits on --fi-bg #000.
  float hn = clamp(h, 0.0, 1.0);
  col *= pow(hn, 1.7) * 2.0;

  // Saturation boost — palette averaging otherwise grays the film out.
  float luma = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(luma), col, 1.35);

  // Faint specular streak from the height gradient.
  float e = 0.02;
  vec2 grad = vec2(
    fbm(p + 2.8 * r + vec2(e, 0.0)) - h,
    fbm(p + 2.8 * r + vec2(0.0, e)) - h
  ) / e;
  col += smoothstep(1.1, 2.4, length(grad)) * 0.10;

  // Background photographs: sampled full-frame, dragged by the same domain-warp
  // field r so they churn with the oil, cross-faded A->B, and screen-blended
  // weighted by film height so a photo surfaces in the bright bands and sinks
  // to black in the troughs.
  vec2 uvP = uv + (r - 0.5) * 0.06;
  if (uPhotoAmount > 0.001) {
    vec3 photoA = texture(uPhotoA, coverUV(uvP, uPhotoScaleA)).rgb;
    vec3 photoB = texture(uPhotoB, coverUV(uvP, uPhotoScaleB)).rgb;
    vec3 photo = mix(photoA, photoB, uPhotoMix);
    float weight = uPhotoAmount * smoothstep(0.15, 0.75, hn);
    col = 1.0 - (1.0 - col) * (1.0 - photo * weight);
  }

  // Second cross-fade pair, retained for parity with the renderer. This zone
  // feeds only the base layer, so uPhotoAmount2 is 0 and this branch no-ops.
  if (uPhotoAmount2 > 0.001) {
    vec3 photoC = texture(uPhotoC, coverUV(uvP, uPhotoScaleC)).rgb;
    vec3 photoD = texture(uPhotoD, coverUV(uvP, uPhotoScaleD)).rgb;
    vec3 overlay = mix(photoC, photoD, uPhotoMix2);
    float weight2 = uPhotoAmount2 * smoothstep(0.15, 0.75, hn);
    col = 1.0 - (1.0 - col) * (1.0 - overlay * weight2);
  }

  // Vignette, scanline, grain — kills banding on the black field.
  vec2 v = uv - 0.5;
  col *= 1.0 - 0.55 * dot(v, v);
  col *= 1.0 - 0.035 * sin(gl_FragCoord.y * 3.14159);
  col += (hash(gl_FragCoord.xy + uGrainSeed + fract(uTime) * 61.7) - 0.5) * 0.08;

  outColor = vec4(col, 1.0);
}
`
}
