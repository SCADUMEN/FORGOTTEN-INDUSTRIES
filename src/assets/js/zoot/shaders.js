// GLSL ES 3.00 sources for ZOOT. Template literals instead of .glsl files —
// the site has no bundler and /assets is passthrough-copied verbatim.

export const MAX_IMPULSES = 16
export const MAX_FRAGS = 8

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
#define MAX_IMPULSES ${MAX_IMPULSES}
#define MAX_FRAGS ${MAX_FRAGS}

uniform vec2 uResolution;
uniform float uTime;
uniform vec4 uImpulses[MAX_IMPULSES]; // xy: aspect-corrected UV, z: birth, w: strength
uniform sampler2D uTextTex;
uniform vec4 uFragRect[MAX_FRAGS];    // screen/texture UV rect: x, y, w, h
uniform float uFragReveal[MAX_FRAGS];
uniform vec3 uFragTint[MAX_FRAGS];
uniform int uFocusIndex;
uniform float uFocusAmount;
uniform float uThickness;
uniform float uPhase;
uniform vec2 uDrift;
uniform vec3 uPalette[3];             // cyan, magenta, gold
uniform float uGrainSeed;

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

// Gaussian-windowed rotational displacement per live impulse, decaying ~4 s.
vec2 impulseWarp(vec2 p) {
  vec2 disp = vec2(0.0);
  for (int i = 0; i < MAX_IMPULSES; i++) {
    vec4 imp = uImpulses[i];
    float age = uTime - imp.z;
    if (imp.w <= 0.0 || age < 0.0 || age > 5.0) continue;
    vec2 d = p - imp.xy;
    float dist = length(d);
    vec2 swirl = vec2(-d.y, d.x);
    disp += swirl / (dist + 0.15) * imp.w * exp(-age * 0.55) * exp(-dist * dist * 6.0);
  }
  return disp;
}

// Soft interior mask for a UV rect, feathered by the soft parameter.
float rectMask(vec2 uv, vec4 rect, float soft) {
  vec2 lo = smoothstep(rect.xy - soft, rect.xy, uv);
  vec2 hi = 1.0 - smoothstep(rect.xy + rect.zw, rect.xy + rect.zw + soft, uv);
  return lo.x * lo.y * hi.x * hi.y;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float aspect = uResolution.x / uResolution.y;
  vec2 p = uv * vec2(aspect, 1.0) * 2.2;
  p += impulseWarp(uv * vec2(aspect, 1.0));

  // Domain-warped fbm: the double warp produces the churning marble.
  float t = uTime * 0.03;
  vec2 q = vec2(
    fbm(p + t * uDrift),
    fbm(p + vec2(5.2, 1.3) + t * uDrift)
  );
  vec2 r = vec2(
    fbm(p + 2.0 * q + vec2(1.7, 9.2) + uTime * 0.021),
    fbm(p + 2.0 * q + vec2(8.3, 2.8) + uTime * 0.019)
  );
  float h = fbm(p + 2.4 * r);

  // The fluid stills around a focused fragment.
  float focusMask = 0.0;
  if (uFocusIndex >= 0) {
    focusMask = rectMask(uv, uFragRect[uFocusIndex], 0.06) * uFocusAmount;
    h = mix(h, h * 0.3 + 0.28, focusMask);
  }

  // Thin-film interference across three wavelengths.
  float opd = h * uThickness + uPhase;
  vec3 film = 0.5 + 0.5 * cos(opd * vec3(1.0 / 0.65, 1.0 / 0.55, 1.0 / 0.45) * 12.0 + vec3(0.0, 0.6, 1.0));

  // Grade toward the house palette, weighted by channel response.
  vec3 pal = film.g * uPalette[0] + film.r * uPalette[1] + film.b * uPalette[2];
  pal /= max(film.r + film.g + film.b, 1e-3);
  vec3 col = mix(film, pal, 0.55);

  // Troughs fall to black; the slick sits on --fi-bg #000.
  float hn = clamp(h, 0.0, 1.0);
  col *= pow(hn, 1.7) * 2.0;

  // Saturation boost — palette averaging otherwise grays the film out.
  float luma = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(luma), col, 1.35);

  // Faint specular streak from the height gradient.
  float e = 0.02;
  vec2 grad = vec2(
    fbm(p + 2.4 * r + vec2(e, 0.0)) - h,
    fbm(p + 2.4 * r + vec2(0.0, e)) - h
  ) / e;
  col += smoothstep(1.1, 2.4, length(grad)) * 0.10;

  // Text sheet: fragments emerge from and dissolve into the film.
  for (int i = 0; i < MAX_FRAGS; i++) {
    float reveal = uFragReveal[i];
    if (reveal <= 0.001) continue;
    vec4 rect = uFragRect[i];
    float region = rectMask(uv, rect, 0.07);
    if (region <= 0.001) continue;

    float focus = (i == uFocusIndex) ? uFocusAmount : 0.0;
    float submerged = 1.0 - reveal;
    vec2 warp = (r - 0.5) * (0.002 + 0.045 * submerged) * (1.0 - focus);
    vec2 tuv = uv + warp;

    float aC = texture(uTextTex, tuv).r;
    float aR = texture(uTextTex, tuv + warp * 0.6).r;
    float aB = texture(uTextTex, tuv - warp * 0.6).r;

    float legibility = smoothstep(0.05, 0.85, max(reveal, focus)) * (0.55 + 0.45 * hn);
    legibility = max(legibility, focus);
    vec3 tA = vec3(aR, aC, aB) * legibility * region;

    // Dark occlusion halo so glyphs read against bright interference bands.
    float halo = texture(uTextTex, tuv + warp * 2.0).r;
    col *= 1.0 - 0.45 * halo * legibility * region;

    vec3 textCol = mix(uFragTint[i], vec3(0.969, 0.957, 0.937), reveal * reveal);
    col = col * (1.0 - tA * 0.85) + textCol * tA;
  }

  // Vignette, scanline, grain — kills banding on the black field.
  vec2 v = uv - 0.5;
  col *= 1.0 - 0.55 * dot(v, v);
  col *= 1.0 - 0.035 * sin(gl_FragCoord.y * 3.14159);
  col += (hash(gl_FragCoord.xy + uGrainSeed) - 0.5) * 0.02;

  outColor = vec4(col, 1.0);
}
`
}
