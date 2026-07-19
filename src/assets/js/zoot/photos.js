// Background-photograph scheduler for ZOOT. Preloads/decodes images from the
// build-time manifest and drives a two-slot cross-fade the shader composites
// into the oil film. GL texture slot 0 is uPhotoA, slot 1 is uPhotoB; `front`
// tracks which slot is fully shown so we fade into the back slot and never
// re-upload the image we just displayed. Returns per-frame photo state:
// { mix, amount, scaleA, scaleB } — amount stays 0 until the first image is
// live and when the manifest is empty, so ZOOT is visually unchanged then.

const HOLD = 9 // s a photo holds before fading out
const FADE = 3.5 // s cross-fade
const RAMP = 2.5 // s initial presence ramp-in
const TARGET = 0.85 // peak presence

// object-fit: cover as a UV scale for coverUV() in the shader.
function coverScale(imgAspect, viewAspect) {
  return [
    Math.max(1, imgAspect / viewAspect),
    Math.max(1, viewAspect / imgAspect),
  ]
}

export function createPhotos({ manifest, renderer, getAspect }) {
  const state = { mix: 0, amount: 0, scaleA: [1, 1], scaleB: [1, 1] }
  const list = Array.isArray(manifest) ? manifest.filter((p) => p && p.src) : []

  if (!list.length) {
    return { update: () => state, reset() {}, setRenderer() {} }
  }

  const single = list.length === 1
  const cache = new Map() // src -> { img, aspect }
  const slotAspect = [1, 1] // GL slot 0 / 1 image aspect
  let gl = renderer
  let cursor = 0
  let front = 0 // GL slot currently fully shown
  let phase = 'boot' // boot -> hold -> fade
  let fadeStart = 0
  let backReady = false // next image uploaded into the back slot
  let loading = false
  let lastTime = -1

  function load(idx) {
    const { src } = list[idx]
    if (cache.has(src)) return Promise.resolve(cache.get(src))
    const img = new Image()
    img.decoding = 'async'
    img.src = src
    return img.decode().then(() => {
      const entry = { img, aspect: img.naturalWidth / img.naturalHeight }
      cache.set(src, entry)
      return entry
    })
  }

  // Decode the next index and upload it into the back slot.
  function primeBack() {
    if (loading || single) return
    loading = true
    const next = (cursor + 1) % list.length
    load(next)
      .then((entry) => {
        const back = 1 - front
        gl.uploadPhoto(back, entry.img)
        slotAspect[back] = entry.aspect
        cursor = next
        backReady = true
      })
      .catch((err) => {
        // Skip a broken file and try the following one next tick.
        console.warn('[zoot] photo load failed:', err)
        cursor = (cursor + 1) % list.length
      })
      .finally(() => {
        loading = false
      })
  }

  function boot() {
    load(cursor)
      .then((entry) => {
        gl.uploadPhoto(front, entry.img)
        slotAspect[front] = entry.aspect
        phase = 'hold'
        fadeStart = 0
        primeBack()
      })
      .catch((err) => {
        console.warn('[zoot] photo load failed:', err)
        cursor = (cursor + 1) % list.length
      })
  }

  boot()

  return {
    setRenderer(r) {
      gl = r
    },

    // Re-boot after a WebGL context loss: textures are gone, re-upload from
    // the (still-decoded) cache without re-fetching.
    reset() {
      phase = 'boot'
      front = 0
      backReady = false
      loading = false
      state.mix = 0
      boot()
    },

    update(time) {
      const dt = lastTime < 0 ? 0 : Math.min(0.1, Math.max(0, time - lastTime))
      lastTime = time

      if (phase === 'boot') {
        state.amount = 0
        return state
      }

      // Presence ramps in once the first photo is live, then holds.
      state.amount += (TARGET - state.amount) * Math.min(1, dt / RAMP)

      if (!single) {
        if (phase === 'hold') {
          if (!backReady && !loading) primeBack()
          if (fadeStart === 0) fadeStart = time // mark hold start
          if (backReady && time - fadeStart >= HOLD) {
            phase = 'fade'
            fadeStart = time
          }
        } else if (phase === 'fade') {
          const t = Math.min(1, (time - fadeStart) / FADE)
          // Fade toward the back slot; direction depends on which slot is front.
          state.mix = front === 0 ? t : 1 - t
          if (t >= 1) {
            front = 1 - front
            backReady = false
            phase = 'hold'
            fadeStart = 0
            primeBack()
          }
        }
      }

      const view = getAspect()
      state.scaleA = coverScale(slotAspect[0], view)
      state.scaleB = coverScale(slotAspect[1], view)
      return state
    },
  }
}
