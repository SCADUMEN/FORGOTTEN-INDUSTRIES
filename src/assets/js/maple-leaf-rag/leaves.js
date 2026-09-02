// Falling ❦ leaves for MAPLE LEAF RAG ZONE. A 2D-canvas particle layer that
// sits above the WebGL slick: red maple-leaf glyphs drift down, sway, tumble,
// and scatter away from the pointer, each trailing a wake of small particles
// that fade out in alpha behind it. Fully independent of the slick — it shares
// no state and runs its own RAF, resize, visibility, and pointer handling, so
// the slick itself stays passive.
//
// The layer's canvas is pointer-events:none; the pointer is tracked on window
// so the chrome links underneath stay clickable. createLeaves() no-ops if the
// canvas isn't on the page.

const GLYPH = '❦' // ❦ — same mark as the header nav
const COLOR = '#ff0000'
const COLOR_RGB = '255, 0, 0' // for rgba() trail particles
// Maple grade for the pixel grain — pure red, ember, gold — sampled per pixel
// so the fine trail shimmers across the palette instead of flat red.
const PIXEL_COLORS = ['255, 0, 0', '232, 100, 30', '242, 169, 0']
const REPEL_RADIUS = 150 // px around the pointer that disturbs leaves
const REPEL_STRENGTH = 900 // px/s² impulse at the pointer center
const DAMPING = 0.9 // per-frame decay of the scatter impulse back to falling
const TRAIL_INTERVAL = 0.055 // s between soft-dot emissions per leaf
const TRAIL_LIFE = 2.2 // s a soft-dot trail particle lives (200% longer tail)
const PIXEL_INTERVAL = 0.018 // s between pixel-grain emissions per leaf (denser)
const PIXEL_LIFE = 1.6 // s a pixel-grain particle lives
const PIXEL_BURST = 2 // pixels emitted per grain tick, for timbre
const MAX_TRAIL = 2600 // hard cap on live particles (dots + pixels) across all leaves

// Leaf count scales with viewport area, capped so it stays elegant, not a storm.
function leafCount(w, h) {
  return Math.max(10, Math.min(44, Math.round((w * h) / 30000)))
}

// A pseudo-random spread without Math.random bias concerns — plain uniform is
// fine here; variety per leaf comes from independent phases and sizes.
function rand(min, max) {
  return min + Math.random() * (max - min)
}

function spawn(w, h, seedAbove) {
  return {
    x: rand(0, w),
    // On first fill, distribute across the screen; on respawn, start above it.
    y: seedAbove ? rand(-h * 0.5, -20) : rand(0, h),
    size: rand(56, 152), // 400% larger than the original glyph
    fall: rand(28, 66), // px/s downward
    swayAmp: rand(8, 26), // px horizontal sway amplitude
    swayFreq: rand(0.4, 1.1), // rad/s
    swayPhase: rand(0, Math.PI * 2),
    angle: rand(0, Math.PI * 2),
    spin: rand(-0.9, 0.9), // rad/s baseline tumble
    alpha: rand(0.55, 1),
    vx: 0, // scatter impulse velocity (decays)
    vy: 0,
    emit: rand(0, TRAIL_INTERVAL), // stagger first soft-dot emission per leaf
    emitPx: rand(0, PIXEL_INTERVAL), // stagger first pixel-grain emission
  }
}

export function createLeaves(canvas) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  let w = 0
  let h = 0
  let dpr = 1
  let leaves = []
  // Trail particles: a flat pool of live dots. Each is emitted behind a leaf
  // and fades in alpha + shrinks over TRAIL_LIFE, then is culled.
  let trail = []
  const pointer = { x: 0, y: 0, active: false }
  let rafId = 0
  let lastTime = 0
  let pausedByVisibility = false

  function resize() {
    w = window.innerWidth
    h = window.innerHeight
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const target = leafCount(w, h)
    if (!leaves.length) {
      leaves = Array.from({ length: target }, () => spawn(w, h, false))
    } else if (target > leaves.length) {
      while (leaves.length < target) leaves.push(spawn(w, h, true))
    } else if (target < leaves.length) {
      leaves.length = target
    }
  }

  function step(time) {
    rafId = requestAnimationFrame(step)
    const dt = lastTime ? Math.min(0.05, (time - lastTime) / 1000) : 0
    lastTime = time

    ctx.clearRect(0, 0, w, h)

    // Trail first, so it sits under the leaves. Advance, fade, and cull in one
    // pass: alpha eases out with the square of remaining life for a soft tail.
    // Two kinds share the pool: soft round dots (the body of the wake) and
    // pixel-size squares (fine grain that gives the trail its timbre).
    if (trail.length) {
      const alive = []
      for (const p of trail) {
        p.life -= dt
        if (p.life <= 0) continue
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.vx *= 0.96
        const k = p.life / p.maxLife
        ctx.globalAlpha = p.alpha0 * k * k
        if (p.kind === 'pixel') {
          // A crisp pixel-size square, unsmoothed, sampled from the maple grade.
          ctx.fillStyle = `rgba(${p.color}, 1)`
          ctx.fillRect(p.x, p.y, p.size, p.size)
        } else {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${COLOR_RGB}, 1)`
          ctx.fill()
        }
        alive.push(p)
      }
      trail = alive
    }

    ctx.globalAlpha = 1
    ctx.fillStyle = COLOR
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    for (const leaf of leaves) {
      // Pointer scatter: a soft radial shove, stronger the closer the leaf is,
      // with a touch of extra spin so disturbed leaves tumble.
      if (pointer.active) {
        const dx = leaf.x - pointer.x
        const dy = leaf.y - pointer.y
        const dist = Math.hypot(dx, dy) || 0.0001
        if (dist < REPEL_RADIUS) {
          const f = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH * dt
          leaf.vx += (dx / dist) * f
          leaf.vy += (dy / dist) * f * 0.6
          leaf.spin += (dx / dist) * f * 0.004
        }
      }

      leaf.vx *= DAMPING
      leaf.vy *= DAMPING

      const sway =
        leaf.swayAmp * Math.sin(time * 0.001 * leaf.swayFreq + leaf.swayPhase)
      leaf.x += sway * dt + leaf.vx * dt
      leaf.y += (leaf.fall + leaf.vy) * dt
      leaf.angle += leaf.spin * dt

      // Soft-dot wake: one round particle on an interval. It keeps a little of
      // the leaf's drift plus jitter so the wake spreads as it fades.
      leaf.emit -= dt
      if (leaf.emit <= 0 && trail.length < MAX_TRAIL) {
        leaf.emit += TRAIL_INTERVAL
        trail.push({
          kind: 'dot',
          x: leaf.x,
          y: leaf.y,
          vx: leaf.vx * 0.2 + rand(-8, 8),
          vy: leaf.vy * 0.2 + rand(4, 16),
          size: leaf.size * rand(0.08, 0.16),
          life: TRAIL_LIFE,
          maxLife: TRAIL_LIFE,
          alpha0: leaf.alpha * rand(0.4, 0.7),
        })
      }

      // Pixel grain: a denser burst of tiny squares with wider jitter and a
      // palette-sampled color, scattered around the leaf to add fine timbre.
      leaf.emitPx -= dt
      if (leaf.emitPx <= 0 && trail.length < MAX_TRAIL) {
        leaf.emitPx += PIXEL_INTERVAL
        for (let n = 0; n < PIXEL_BURST && trail.length < MAX_TRAIL; n++) {
          trail.push({
            kind: 'pixel',
            x: leaf.x + rand(-leaf.size * 0.4, leaf.size * 0.4),
            y: leaf.y + rand(-leaf.size * 0.4, leaf.size * 0.4),
            vx: leaf.vx * 0.15 + rand(-22, 22),
            vy: leaf.vy * 0.15 + rand(-6, 26),
            size: rand(1, 2), // pixel-size squares
            life: PIXEL_LIFE * rand(0.6, 1),
            maxLife: PIXEL_LIFE,
            alpha0: leaf.alpha * rand(0.5, 0.95),
            color: PIXEL_COLORS[(Math.random() * PIXEL_COLORS.length) | 0],
          })
        }
      }

      // Wrap: fall off the bottom -> respawn above; drift off the sides -> wrap.
      const m = leaf.size
      if (leaf.y - m > h) {
        Object.assign(leaf, spawn(w, h, true))
        continue
      }
      if (leaf.x < -m) leaf.x = w + m
      else if (leaf.x > w + m) leaf.x = -m

      ctx.save()
      ctx.globalAlpha = leaf.alpha
      ctx.translate(leaf.x, leaf.y)
      ctx.rotate(leaf.angle)
      ctx.font = `${leaf.size}px serif`
      ctx.fillText(GLYPH, 0, 0)
      ctx.restore()
    }
  }

  // Pointer tracking on window so the layer can be pointer-events:none.
  window.addEventListener('pointermove', (e) => {
    pointer.x = e.clientX
    pointer.y = e.clientY
    pointer.active = true
  })
  window.addEventListener('pointerdown', (e) => {
    pointer.x = e.clientX
    pointer.y = e.clientY
    pointer.active = true
  })
  document.addEventListener('pointerleave', () => {
    pointer.active = false
  })
  window.addEventListener('blur', () => {
    pointer.active = false
  })

  let resizeTimer = 0
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(resize, 150)
  })

  // Pause with the tab to match the slick's render loop.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId)
      pausedByVisibility = true
    } else if (pausedByVisibility) {
      pausedByVisibility = false
      lastTime = 0
      rafId = requestAnimationFrame(step)
    }
  })

  resize()
  rafId = requestAnimationFrame(step)
}
