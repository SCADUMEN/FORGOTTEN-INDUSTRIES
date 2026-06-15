(function () {
  if (typeof window === 'undefined') return
  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches
  if (reducedMotion) return

  function init() {
    document.querySelectorAll('.site-mark').forEach(setup)
  }

  function setup(mark) {
    const label = mark.querySelector('span')
    if (!label) return
    const text = label.textContent.trim()
    if (!text) return

    const style = getComputedStyle(label)
    const fontSize = parseFloat(style.fontSize)
    const font = `${style.fontWeight || '700'} ${fontSize}px ${style.fontFamily}`

    const measureCtx = document.createElement('canvas').getContext('2d')
    measureCtx.font = font
    const upper = text.toUpperCase()
    const textWidth = Math.ceil(measureCtx.measureText(upper).width)
    const textHeight = Math.ceil(fontSize * 1.2)

    const pad = Math.ceil(fontSize * 2.2)
    const w = textWidth + pad * 2
    const h = textHeight + pad * 2
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const canvas = document.createElement('canvas')
    canvas.setAttribute('aria-hidden', 'true')
    canvas.className = 'site-mark-ghost-canvas'
    canvas.style.left = `${-pad}px`
    canvas.style.top = `${(textHeight - h) / 2}px`
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    canvas.width = w * dpr
    canvas.height = h * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    label.appendChild(canvas)
    mark.classList.add('js-ghost')

    const sampler = document.createElement('canvas')
    sampler.width = w
    sampler.height = h
    const sctx = sampler.getContext('2d')
    sctx.font = font
    sctx.textBaseline = 'middle'
    sctx.fillStyle = '#fff'
    sctx.fillText(upper, pad, h / 2)
    const pixels = sctx.getImageData(0, 0, w, h).data

    const step = Math.max(2, Math.floor(fontSize / 7))
    const particles = []
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        if (pixels[(y * w + x) * 4 + 3] > 128) {
          particles.push({
            tx: x,
            ty: y,
            x: x + (Math.random() - 0.5) * w * 1.6,
            y: y + (Math.random() - 0.5) * h * 2.4,
            vx: (Math.random() - 0.5) * 30,
            vy: (Math.random() - 0.5) * 30,
            phase: Math.random() * Math.PI * 2,
            alpha: 0,
          })
        }
      }
    }

    const cx = w / 2
    const cy = h / 2
    let active = false
    let raf = 0
    let last = 0

    function tick(now) {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'lighter'

      const targetAlpha = active ? 1 : 0
      let busy = false

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.phase += dt * 5.5
        const jx = Math.sin(p.phase) * 0.7
        const jy = Math.cos(p.phase * 1.3) * 0.7

        if (active) {
          const ax = (p.tx + jx - p.x) * 22
          const ay = (p.ty + jy - p.y) * 22
          p.vx = p.vx * 0.78 + ax * dt
          p.vy = p.vy * 0.78 + ay * dt
        } else {
          const dx = p.x - cx
          const dy = p.y - cy
          const d = Math.hypot(dx, dy) + 0.001
          p.vx += (dx / d) * 28 * dt + (Math.random() - 0.5) * 8 * dt
          p.vy += (dy / d) * 28 * dt + (Math.random() - 0.5) * 8 * dt
          p.vx *= 0.93
          p.vy *= 0.93
        }

        p.x += p.vx * dt * 60
        p.y += p.vy * dt * 60
        p.alpha += (targetAlpha - p.alpha) * Math.min(1, dt * 5)

        if (p.alpha > 0.01) {
          busy = true
          const a = p.alpha
          ctx.fillStyle = `rgba(220, 235, 255, ${a * 0.55})`
          ctx.fillRect(p.x, p.y, 1.6, 1.6)
          if (a > 0.35) {
            ctx.fillStyle = `rgba(150, 200, 255, ${a * 0.18})`
            ctx.fillRect(p.x - 1, p.y - 1, 3.4, 3.4)
          }
        }
      }

      if (active || busy) {
        raf = requestAnimationFrame(tick)
      } else {
        raf = 0
      }
    }

    function start() {
      active = true
      if (!raf) {
        last = performance.now()
        raf = requestAnimationFrame(tick)
      }
    }

    function stop() {
      active = false
      if (!raf) {
        last = performance.now()
        raf = requestAnimationFrame(tick)
      }
    }

    mark.addEventListener('pointerenter', start)
    mark.addEventListener('pointerleave', stop)
    mark.addEventListener('focus', start)
    mark.addEventListener('blur', stop)
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(init)
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
