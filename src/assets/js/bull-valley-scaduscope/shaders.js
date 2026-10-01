// GLSL for BULL VALLEY SCADUSCOPE. One full-screen triangle; the fragment
// shader draws the whole map: real terrain (hillshade lit by the real sun or
// moon, 2 m contours), the vector layers rasterized by layers.js, live weather
// (cloud shadow drifting with the real wind, fog, rain), and the shadowmen's
// auras. uHigh (0..1) walks everything from a sober survey sheet toward a
// warped, cycling, iridescent one — the data stays legible at every setting.
//
// Map space ("m") is the unit square of scripts/fetch_bull_valley.cjs: x east,
// y south (down), 0..1. Textures are uploaded unflipped, so a texel's t is map y.

export const MAX_HERDS = 40

export const VERT = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`

export function fragmentSource(octaves) {
  return `#version 300 es
precision highp float;

#define OCTAVES ${octaves}
#define MAX_HERDS ${MAX_HERDS}
#define TAU 6.28318530718

uniform vec2 uResolution;
uniform float uTime;
uniform vec4 uMapRect;      // drawing-buffer px, y-down: x, y, w, h
uniform vec2 uMetres;       // map width, height in metres
uniform vec2 uElev;         // min, max elevation in metres
uniform float uHigh;        // 0..1
uniform float uDark;        // 0 day .. 1 night
uniform vec3 uSun;          // unit vector toward the sun, map space + up
uniform vec3 uMoon;         // unit vector toward the moon
uniform float uMoonLight;   // illuminated fraction, 0 when below horizon
uniform float uCloud;       // 0..1
uniform float uFog;         // 0..1
uniform float uWet;         // 0..1
uniform vec2 uWind;         // cloud drift, map units per second
uniform float uTraffic;     // 0..1, current share of peak-hour flow
uniform float uWitching;    // 0 or 1
uniform float uGrainSeed;
uniform float uSweep;       // radar line angle, radians, y-down (clockwise)
uniform vec4 uRadar;        // drawing-buffer px: centre x, y, radius, px per km
uniform float uRadarOn;     // 0 under reduced motion (rings only, no sweep)
uniform float uPulse;       // 0..1 flash on the sweep line, once per whole note
uniform float uPulseTint;   // 0 high beep (green), 1 low beep (magenta)
uniform int uHerdCount;
uniform vec4 uHerds[MAX_HERDS]; // x, y (map), radius (map x units), alpha
uniform sampler2D uTerrain; // R high byte, G low byte of normalized height
uniform sampler2D uLayersA; // R roads, G water, B wetland, A boundary
uniform sampler2D uLayersB; // R reserves, G graveyards, B traffic heat

out vec4 outColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < OCTAVES; i++) {
    v += a * noise(p);
    p = p * 2.03 + 17.1;
    a *= 0.5;
  }
  return v;
}

float height(vec2 m) {
  vec2 rg = texture(uTerrain, m).rg;
  return (rg.r * 65280.0 + rg.g * 255.0) / 65535.0;
}

// Cosine palette (Inigo Quilez) for the high end of the dial.
vec3 psych(float t) {
  return 0.5 + 0.5 * cos(TAU * (vec3(1.0, 1.0, 1.0) * t + vec3(0.0, 0.33, 0.67)));
}

// The sober survey palette: low ground teal, high ground terminal green.
vec3 survey(float e) {
  vec3 low = vec3(0.02, 0.10, 0.12);
  vec3 mid = vec3(0.05, 0.20, 0.13);
  vec3 high = vec3(0.16, 0.34, 0.16);
  return e < 0.5 ? mix(low, mid, e * 2.0) : mix(mid, high, e * 2.0 - 1.0);
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y);
  vec2 m0 = (px - uMapRect.xy) / uMapRect.zw;
  float h = uHigh;
  float t = uTime;

  // Warp: a barely-there shimmer when sober, a breathing melt at 10.
  vec2 warp = vec2(fbm(m0 * 3.0 + t * 0.03), fbm(m0 * 3.0 + 9.7 - t * 0.025)) - 0.5;
  vec2 m = m0 + warp * (0.0015 + 0.03 * h * h);

  float inside =
    step(0.0, m.x) * step(m.x, 1.0) * step(0.0, m.y) * step(m.y, 1.0);

  // --- terrain ------------------------------------------------------------
  float e = height(m);
  float metres = mix(uElev.x, uElev.y, e);
  float span = uElev.y - uElev.x;
  vec2 tx = vec2(1.0 / 512.0, 0.0);
  float dx = (height(m + tx.xy) - height(m - tx.xy)) * span / (2.0 * tx.x * uMetres.x);
  float dy = (height(m + tx.yx) - height(m - tx.yx)) * span / (2.0 * tx.x * uMetres.y);
  float relief = 7.0 + 10.0 * h; // vertical exaggeration
  vec3 n = normalize(vec3(-dx * relief, -dy * relief, 1.0));
  float sunLit = max(dot(n, uSun), 0.0) * step(0.0, uSun.z);
  float moonLit = max(dot(n, uMoon), 0.0) * uMoonLight;
  float lit = mix(sunLit, moonLit * 0.55, uDark) + 0.12;

  // Contours every 2 m, index contours every 10 m.
  float c2 = metres / 2.0;
  float c10 = metres / 10.0;
  float line2 = 1.0 - smoothstep(0.0, fwidth(c2) * 1.2, abs(fract(c2 - 0.5) - 0.5));
  float line10 = 1.0 - smoothstep(0.0, fwidth(c10) * 1.6, abs(fract(c10 - 0.5) - 0.5));

  float phase = e * 2.2 + t * 0.04 * h + warp.x * 2.0 * h;
  vec3 ground = mix(survey(e), psych(phase) * 0.55, smoothstep(0.1, 1.0, h));
  vec3 col = ground * lit;

  vec3 lineCol = mix(vec3(0.29, 0.87, 0.5), psych(phase + 0.5), h);
  float nightGlow = 0.35 + 0.65 * uDark;
  col += lineCol * (line2 * 0.10 + line10 * 0.32) * nightGlow;

  // --- vector layers ------------------------------------------------------
  vec4 A = texture(uLayersA, m);
  vec4 B = texture(uLayersB, m);

  vec3 waterCol = mix(vec3(0.13, 0.83, 0.93), psych(phase + 0.25), h * 0.8);
  float shimmer = 0.75 + 0.25 * sin(t * 1.3 + (m.x + m.y) * 240.0 + warp.y * 10.0);
  col = mix(col, waterCol * (0.35 + 0.4 * nightGlow) * shimmer, A.g * 0.85);

  float hatch = step(0.5, fract((m.x - m.y) * 380.0));
  col += vec3(0.13, 0.55, 0.45) * A.b * hatch * 0.22;
  col += vec3(0.29, 0.87, 0.5) * B.r * 0.06;

  float graveyardPulse = 0.6 + 0.4 * sin(t * (0.6 + 2.0 * h));
  vec3 graveCol = mix(vec3(0.91, 0.47, 0.98), psych(phase + t * 0.1), h * 0.6);
  col += graveCol * B.g * graveyardPulse * (0.35 + 0.5 * uDark);

  vec3 roadCol = vec3(0.97, 0.96, 0.94) * (0.18 + 0.12 * uDark);
  col = mix(col, roadCol + col * 0.4, A.r * 0.8);
  vec3 heatCol = mix(vec3(0.98, 0.75, 0.14), vec3(1.0, 0.25, 0.1), B.b);
  col += heatCol * B.b * (0.12 + 0.55 * uTraffic) * (0.5 + 0.5 * uDark);

  float dash = step(0.35, fract((m.x * 0.8 + m.y) * 90.0 - t * 0.15));
  col += vec3(0.96, 0.62, 0.04) * A.a * (0.35 + 0.35 * dash);

  // --- weather ------------------------------------------------------------
  vec2 cm = m * 2.2 - uWind * t;
  float cloudField = fbm(cm) * 0.7 + fbm(cm * 2.7 + 3.1) * 0.3;
  float cloudShadow = smoothstep(1.0 - uCloud, 1.0 - uCloud + 0.35, cloudField);
  col *= 1.0 - cloudShadow * 0.35 * (1.0 - uDark * 0.5);
  float rain = step(0.97, hash(floor(vec2(px.x * 0.35 + px.y * 0.12, px.y * 0.02 - t * 30.0))));
  col += vec3(0.6, 0.8, 1.0) * rain * uWet * 0.18;
  col = mix(col, vec3(0.34, 0.4, 0.45) * (0.4 + 0.6 * (1.0 - uDark)), uFog * 0.45);

  // --- shadowmen auras ----------------------------------------------------
  float aspect = uMetres.y / uMetres.x;
  for (int i = 0; i < MAX_HERDS; i++) {
    if (i >= uHerdCount) break;
    vec4 herd = uHerds[i];
    vec2 d = (m - herd.xy) * vec2(1.0, aspect);
    float r = herd.z;
    float wob = fbm(d / r * 1.5 + t * 0.2 + float(i)) - 0.5;
    float dist = length(d) / r + wob * 0.6;
    float aura = exp(-dist * dist * 1.6) * herd.w;
    col *= 1.0 - aura * 0.75;
    float ring = exp(-pow((dist - 1.1) / 0.18, 2.0)) * herd.w;
    vec3 fringe = mix(vec3(0.49, 0.11, 0.11), psych(dist * 0.5 - t * 0.2), h);
    col += fringe * ring * (0.1 + 0.35 * h);
  }

  // --- outside the frame --------------------------------------------------
  vec2 grid = abs(fract(px / 24.0) - 0.5);
  float scan = step(0.47, max(grid.x, grid.y)) * 0.05;
  vec3 voidCol = vec3(0.0, 0.05, 0.02) * (0.4 + scan * 6.0)
    + psych(fbm(m0 * 1.5 + t * 0.02) + t * 0.02) * 0.05 * h;
  col = mix(voidCol, col, inside);

  // --- radar --------------------------------------------------------------
  // A clockwise sweep from the village centre: a bright line, a phosphor wedge
  // trailing behind it (green when sober, iridescent and longer when high),
  // range rings every kilometre, and bearing ticks every 30°.
  vec2 rv = px - uRadar.xy;
  float rdist = length(rv);
  float inScope = 1.0 - smoothstep(uRadar.z - 2.0, uRadar.z, rdist);
  float bearing = atan(rv.y, rv.x);
  float since = mod(uSweep - bearing, TAU);
  float persist = 0.3 + 0.45 * h;
  float wedge = exp(-since / (TAU * persist) * 3.0) * uRadarOn;
  float lineWidth = (1.5 + 2.5 * uPulse) / max(rdist, 1.0);
  float sweepLine = (1.0 - smoothstep(0.0, lineWidth * 2.0, since)) * uRadarOn;
  // The two beeps get opposite hues, phosphor green (high B) and hot magenta
  // (low B), so the alternation reads at any setting. The trail and rings keep
  // at least 45% of the beep colour at full zoot; the line itself is always
  // the pure beep colour (see below).
  vec3 beep = mix(vec3(0.0, 1.0, 0.35), vec3(1.0, 0.12, 0.85), uPulseTint);
  vec3 phosphor = mix(
    beep,
    psych(since * 0.35 - t * 0.08 + rdist / uRadar.z * 0.6),
    smoothstep(0.15, 0.9, h) * 0.55
  );
  float km = rdist / uRadar.w;
  float ring = 1.0 - smoothstep(0.0, fwidth(km) * 1.2, abs(fract(km - 0.5) - 0.5));
  float tickAngle = mod(bearing + TAU, TAU / 12.0);
  float tick = (1.0 - smoothstep(0.0, 1.2 / max(rdist, 1.0), min(tickAngle, TAU / 12.0 - tickAngle)))
    * step(uRadar.z - 14.0, rdist);
  col += phosphor * inScope * wedge * (0.1 + 0.08 * h) * (1.0 + 0.6 * uPulse);
  col += phosphor * inScope * (ring * 0.07 + tick * 0.35) * (0.6 + 0.4 * wedge);
  // The line is painted over the map, not added to it, so it stays the pure
  // beep colour on even the brightest background; each flash whitens it.
  vec3 sweepCol = mix(beep, vec3(1.0), 0.3 * uPulse);
  col = mix(col, sweepCol, clamp(sweepLine * inScope * (0.75 + 0.25 * uPulse), 0.0, 1.0));

  // Witching hour: a slow violet breath across everything.
  col += vec3(0.25, 0.0, 0.35) * uWitching * (0.08 + 0.06 * sin(t * 0.8));

  // Grain, scanline, vignette.
  float grain = hash(px + fract(t * 7.0) * 91.0 + uGrainSeed) - 0.5;
  col += grain * (0.035 + 0.04 * h);
  col *= 0.94 + 0.06 * sin(px.y * 3.14159);
  vec2 q = gl_FragCoord.xy / uResolution - 0.5;
  col *= 1.0 - dot(q, q) * 0.6;

  outColor = vec4(max(col, 0.0), 1.0);
}`
}
