// Deterministic PRNG (mulberry32) so the scattered world — trees, headstones,
// reeds, pickups — is identical for every visitor and every visit.
export function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const range = (rng, lo, hi) => lo + rng() * (hi - lo)

export const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)]
