// Background-photograph scheduler for ZOOT. Two independent layers feed the
// shader: the base layer holds and cross-fades the Matthew Marx set one at a
// time, while the Shadow Zone overlay cross-fades continuously on a second
// texture pair so one found image is always mid-transition. Each layer is a
// two-slot cross-fade; createPhotos runs one per layer and merges their state.
//
// GL texture slots: base uses 0 (A) / 1 (B), overlay uses 2 (C) / 3 (D). Each
// stream tracks its own front slot (local 0/1) and uploads at slotOffset+slot,
// so it re-uploads only the image it is fading toward. Merged per-frame state:
// base -> { mix, amount, scaleA, scaleB }, overlay -> { mix2, amount2, scaleC,
// scaleD }. amount/amount2 stay 0 until the first image of that layer is live
// and when its list is empty, so a missing layer leaves ZOOT unchanged.

const RAMP = 2.5 // s initial presence ramp-in (shared by both layers)

// object-fit: cover as a UV scale for coverUV() in the shader.
function coverScale(imgAspect, viewAspect) {
  return [
    Math.max(1, imgAspect / viewAspect),
    Math.max(1, viewAspect / imgAspect),
  ]
}

// Fisher-Yates, in place. Runtime-only so playback order differs each page
// load; the build manifest stays ordered and reproducible.
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// One two-slot cross-fade layer. `slotOffset` maps its local slots 0/1 onto the
// renderer's absolute photo texture slots (base 0, overlay 2). `hold` 0 makes
// the layer transition continuously. Returns per-frame { mix, amount, scaleA,
// scaleB } for its own pair.
function makeStream({
  list,
  slotOffset,
  renderer,
  getAspect,
  hold,
  fade,
  target,
}) {
  const state = { mix: 0, amount: 0, scaleA: [1, 1], scaleB: [1, 1] }

  if (!list.length) {
    return { update: () => state, reset() {}, setRenderer() {} }
  }

  // Shuffle a copy so each load starts on a different image and order.
  list = shuffle(list.slice())

  const single = list.length === 1
  const cache = new Map() // src -> { img, aspect }
  const slotAspect = [1, 1] // local slot 0 / 1 image aspect
  let gl = renderer
  let cursor = 0
  let front = 0 // local slot currently fully shown
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
        gl.uploadPhoto(slotOffset + back, entry.img)
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
        gl.uploadPhoto(slotOffset + front, entry.img)
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
      state.amount += (target - state.amount) * Math.min(1, dt / RAMP)

      if (!single) {
        if (phase === 'hold') {
          if (!backReady && !loading) primeBack()
          if (fadeStart === 0) fadeStart = time // mark hold start
          if (backReady && time - fadeStart >= hold) {
            phase = 'fade'
            fadeStart = time
          }
        } else if (phase === 'fade') {
          const t = Math.min(1, (time - fadeStart) / fade)
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

export function createPhotos({ base, overlay, renderer, getAspect }) {
  const baseList = Array.isArray(base) ? base.filter((p) => p && p.src) : []
  const overlayList = Array.isArray(overlay)
    ? overlay.filter((p) => p && p.src)
    : []

  // Base keeps the calm hold-and-fade rhythm; overlay holds for 0s so a Shadow
  // Zone image is always transitioning. target tempers the overlay so two
  // stacked screen-blends do not wash out the film.
  const baseStream = makeStream({
    list: baseList,
    slotOffset: 0,
    renderer,
    getAspect,
    hold: 9,
    fade: 3.5,
    target: 1.1,
  })
  const overlayStream = makeStream({
    list: overlayList,
    slotOffset: 2,
    renderer,
    getAspect,
    hold: 0,
    fade: 7,
    target: 0.85,
  })

  const merged = {
    mix: 0,
    amount: 0,
    scaleA: [1, 1],
    scaleB: [1, 1],
    mix2: 0,
    amount2: 0,
    scaleC: [1, 1],
    scaleD: [1, 1],
  }

  return {
    setRenderer(r) {
      baseStream.setRenderer(r)
      overlayStream.setRenderer(r)
    },
    reset() {
      baseStream.reset()
      overlayStream.reset()
    },
    update(time) {
      const b = baseStream.update(time)
      const o = overlayStream.update(time)
      merged.mix = b.mix
      merged.amount = b.amount
      merged.scaleA = b.scaleA
      merged.scaleB = b.scaleB
      merged.mix2 = o.mix
      merged.amount2 = o.amount
      merged.scaleC = o.scaleA
      merged.scaleD = o.scaleB
      return merged
    },
  }
}
