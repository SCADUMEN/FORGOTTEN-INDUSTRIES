// BULL VALLEY SCADUSCOPE overlay: the 2D layer above the shader. Draws what
// needs crisp edges or text — traffic headlights on the real IDOT segments,
// the shadowmen themselves, graveyard labels, and gas stations (all outside the
// village) as bearings on the frame edge. Never intercepts the pointer.

import { hourShare, HOURLY_SHARE } from './traffic.js'
import { behind, echo, SWEEP_SECONDS } from './radar.js'
import { distance } from './units.js'

const MAX_GHOSTS = 2500
// Between radar passes a figure's halo and outline never drop below this, so
// the shadowmen stay findable on even the loudest background.
const OUTLINE_FLOOR = 0.45
// How long a tagged shadowman flinches before walking on, seconds.
const FLINCH_SECONDS = 0.7
// How long a newly named shadowman's name card floats beside it, seconds.
const NAME_CARD_SECONDS = 4

// Map tag: "#07" for a loner, "#07 ×5" for a herd.
function herdTag(h) {
  const id = `#${String(h.id).padStart(2, '0')}`
  return h.members.length === 1 ? id : `${id} ×${h.members.length}`
}

const MAX_CARS = 520
const PEAK_SHARE = Math.max(...HOURLY_SHARE)
const MONO = "'Space Mono', ui-monospace, monospace"
const LABEL_ALPHA = 0.55

export function createOverlay(canvas, geo) {
  const ctx = canvas.getContext('2d')
  const W = geo.metres.width
  const H = geo.metres.height
  let dpr = 1
  let rect = { x: 0, y: 0, w: 1, h: 1 }

  // Traffic segments with cumulative lengths in metres, weighted by AADT.
  const segs = geo.traffic
    .map((s) => {
      const cum = [0]
      for (let i = 1; i < s.p.length; i++) {
        const dx = (s.p[i][0] - s.p[i - 1][0]) * W
        const dy = (s.p[i][1] - s.p[i - 1][1]) * H
        cum.push(cum[i - 1] + Math.hypot(dx, dy))
      }
      return { p: s.p, cum, len: cum[cum.length - 1], v: s.v }
    })
    .filter((s) => s.len > 0)
  const weights = segs.map((s) => s.v * s.len)
  const totalWeight = weights.reduce((a, b) => a + b, 0)

  const cars = []
  // Radar afterimages: one per figure per sweep, left where the line found it.
  const ghosts = []
  const pickSeg = () => {
    let r = Math.random() * totalWeight
    for (let i = 0; i < segs.length; i++) {
      r -= weights[i]
      if (r <= 0) return i
    }
    return segs.length - 1
  }
  const newCar = () => {
    const s = pickSeg()
    return {
      s,
      d: Math.random() * segs[s].len,
      dir: Math.random() < 0.5 ? 1 : -1,
      speed: 140 + Math.random() * 120, // compressed time, metres/s
    }
  }

  const along = (seg, d) => {
    const { p, cum } = seg
    let i = 1
    while (i < cum.length - 1 && cum[i] < d) i++
    const t = (d - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1])
    return [
      p[i - 1][0] + (p[i][0] - p[i - 1][0]) * t,
      p[i - 1][1] + (p[i][1] - p[i - 1][1]) * t,
    ]
  }

  const toPx = ([x, y]) => [rect.x + x * rect.w, rect.y + y * rect.h]

  // Nearest station per ~12° of bearing, pinned to the frame edge.
  function fuelBearings() {
    const out = []
    const clusters = new Map()
    for (const f of geo.fuel) {
      const [x, y] = f.p
      if (x >= 0 && x <= 1 && y >= 0 && y <= 1) continue
      const dx = (x - 0.5) * W
      const dy = (y - 0.5) * H
      const bearing = Math.atan2(dy, dx)
      const key = Math.round(bearing / (Math.PI / 15))
      const km = Math.hypot(dx, dy) / 1000
      const prev = clusters.get(key)
      if (!prev || km < prev.km)
        clusters.set(key, { f, km, bearing, count: (prev?.count || 0) + 1 })
      else prev.count++
    }
    for (const c of clusters.values()) out.push(c)
    return out
  }
  const bearings = fuelBearings()

  // Major street names: the ten most important named roads in frame, ranked
  // by road class and then total length. Each name sits at the midpoint of
  // that road's longest single way, rotated along it.
  function majorStreets(count = 10) {
    const rank = {
      motorway: 0,
      trunk: 1,
      primary: 2,
      secondary: 3,
      tertiary: 4,
    }
    const byName = new Map()
    for (const r of geo.roads) {
      if (!r.n || !(r.c in rank)) continue
      let len = 0
      for (let i = 1; i < r.p.length; i++) {
        len += Math.hypot(
          (r.p[i][0] - r.p[i - 1][0]) * W,
          (r.p[i][1] - r.p[i - 1][1]) * H
        )
      }
      const e = byName.get(r.n) || {
        name: r.n,
        total: 0,
        rank: 9,
        longest: null,
        longestLen: 0,
      }
      e.total += len
      e.rank = Math.min(e.rank, rank[r.c])
      if (len > e.longestLen) {
        e.longest = r.p
        e.longestLen = len
      }
      byName.set(r.n, e)
    }
    return [...byName.values()]
      .sort((a, b) => a.rank - b.rank || b.total - a.total)
      .slice(0, count)
      .map((e) => {
        // Walk to the midpoint by length; take the direction of that segment.
        const p = e.longest
        let walked = 0
        for (let i = 1; i < p.length; i++) {
          const dx = (p[i][0] - p[i - 1][0]) * W
          const dy = (p[i][1] - p[i - 1][1]) * H
          const seg = Math.hypot(dx, dy)
          if (walked + seg >= e.longestLen / 2 || i === p.length - 1) {
            const t = seg ? (e.longestLen / 2 - walked) / seg : 0
            let angle = Math.atan2(dy, dx)
            if (angle > Math.PI / 2) angle -= Math.PI
            if (angle < -Math.PI / 2) angle += Math.PI
            return {
              text: e.name.toUpperCase(),
              at: [
                p[i - 1][0] + (p[i][0] - p[i - 1][0]) * t,
                p[i - 1][1] + (p[i][1] - p[i - 1][1]) * t,
              ],
              angle,
            }
          }
          walked += seg
        }
        return null
      })
      .filter(Boolean)
  }
  const streets = majorStreets()

  // A soft black disc, rendered once and stamped behind each figure to knock
  // the map back around it, so the silhouette reads even on the busiest,
  // most saturated background.
  const halo = (() => {
    const size = 64
    const c = document.createElement('canvas')
    c.width = size
    c.height = size
    const g = c.getContext('2d')
    const mid = size / 2
    const grad = g.createRadialGradient(mid, mid, 0, mid, mid, mid)
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)')
    grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.55)')
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
    g.fillStyle = grad
    g.fillRect(0, 0, size, size)
    return c
  })()

  // `fade` is the figure's fade in/out; `seen` its radar echo (1 as the sweep
  // crosses, dimming between passes). The body and ghosts follow the echo, but
  // the halo and outline keep a floor so every figure stays findable.
  function drawFigure(x0, y0, s, fade, seen0, high, t, m) {
    const phase = m.phase
    // Flinch: for a moment after being tagged, the figure shakes, shows in
    // full, and throws off a magenta ring; then it walks on.
    const flinchAge = m.flinchAt === undefined ? Infinity : t - m.flinchAt
    const flinching = flinchAge >= 0 && flinchAge < FLINCH_SECONDS
    const k = flinching ? 1 - flinchAge / FLINCH_SECONDS : 0
    // Only shake while flinching: sin(Infinity) is NaN, and NaN × 0 is NaN.
    const x = flinching ? x0 + Math.sin(flinchAge * 60) * 3 * k : x0
    const y = flinching ? y0 + Math.cos(flinchAge * 47) * 2 * k : y0
    const seen = flinching ? 1 : seen0
    if (flinching) {
      ctx.globalAlpha = fade * k
      ctx.strokeStyle = '#e879f9'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(x0, y0 - s * 0.3, s * (1 + flinchAge * 7), 0, Math.PI * 2)
      ctx.stroke()
    }

    const alpha = fade * seen
    const marked = fade * Math.max(seen, OUTLINE_FLOOR)
    const sway = Math.sin(t * 2 + phase) * 0.8
    const cx = x + sway
    // Halo first: stronger the higher you are, where the background is loudest.
    const r = s * 2.3
    ctx.globalAlpha = marked * (0.45 + 0.5 * high)
    ctx.drawImage(halo, cx - r, y - s * 0.3 - r, r * 2, r * 2)
    // Chromatic ghosts sit inside the halo, reading as a glitch on the figure.
    if (high > 0.3) {
      const off = 1 + high * 1.5
      ctx.globalAlpha = alpha * 0.55 * high
      ctx.fillStyle = '#e879f9'
      figurePath(cx - off, y, s)
      ctx.fill()
      ctx.fillStyle = '#22d3ee'
      figurePath(cx + off, y, s)
      ctx.fill()
    }
    // Black silhouette with a crisp cream edge that holds on any colour.
    figurePath(cx, y, s)
    ctx.globalAlpha = marked * 0.9
    ctx.strokeStyle = '#f7f4ef'
    ctx.lineWidth = 1.4
    ctx.lineJoin = 'round'
    ctx.stroke()
    ctx.globalAlpha = alpha
    ctx.fillStyle = '#000'
    ctx.fill()
    // Tagged: a small magenta dot above the head, so you know it's counted.
    if (m.tagged) {
      ctx.globalAlpha = marked
      ctx.fillStyle = '#e879f9'
      ctx.beginPath()
      ctx.arc(cx, y - s * 1.9, Math.max(1.6, s * 0.2), 0, Math.PI * 2)
      ctx.fill()
    }
  }

  function figurePath(x, y, s) {
    ctx.beginPath()
    ctx.arc(x, y - s * 1.1, s * 0.32, 0, Math.PI * 2)
    ctx.moveTo(x - s * 0.34, y - s * 0.7)
    ctx.lineTo(x + s * 0.34, y - s * 0.7)
    ctx.lineTo(x + s * 0.12, y + s * 0.6)
    ctx.lineTo(x - s * 0.12, y + s * 0.6)
    ctx.closePath()
  }

  return {
    resize(cssW, cssH, scale) {
      dpr = scale
      canvas.width = Math.round(cssW * scale)
      canvas.height = Math.round(cssH * scale)
    },

    setRect(r) {
      rect = r
    },

    // The figure under a click (CSS px), or null: { h, m } for the nearest
    // clickable shadowman whose drawn body is within reach of the point.
    hitFigure(x, y, herdList) {
      let best = null
      let bestD = Infinity
      for (const h of herdList) {
        for (const m of h.members) {
          if (!m.clickable || m.px === undefined) continue
          const d = Math.hypot(x - m.px, y - m.py)
          if (d <= m.hitR && d < bestD) {
            bestD = d
            best = { h, m }
          }
        }
      }
      return best
    },

    // state: { time, dt, hour, high (0..1), dark, herds, showLabels }
    draw(state) {
      const { time, dt, hour, high, dark } = state
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)

      // Headlights: population tracks the hour's share of daily traffic.
      const want = Math.round(MAX_CARS * (hourShare(hour) / PEAK_SHARE))
      while (cars.length < want) cars.push(newCar())
      if (cars.length > want) cars.length = want
      ctx.fillStyle = dark > 0.5 ? '#fde68a' : '#f7f4ef'
      for (const c of cars) {
        const seg = segs[c.s]
        c.d += c.dir * c.speed * dt
        if (c.d < 0 || c.d > seg.len) Object.assign(c, newCar())
        const [px, py] = toPx(along(seg, c.d))
        ctx.globalAlpha = 0.35 + 0.5 * dark
        ctx.fillRect(px - 1, py - 1, 2, 2)
      }

      // Labels are collected as marks are drawn and placed last, on top, in
      // priority order (graveyards, fuel, herds); one that would overlap an
      // already-placed label is skipped rather than overprinted.
      const labels = []

      // Graveyards: a mark and a name.
      for (const g of geo.graveyards) {
        const [px, py] = toPx(g.c)
        ctx.globalAlpha = 0.75
        ctx.strokeStyle = '#e879f9'
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.moveTo(px, py - 6)
        ctx.lineTo(px, py + 6)
        ctx.moveTo(px - 4, py - 2)
        ctx.lineTo(px + 4, py - 2)
        ctx.stroke()
        if (g.n) {
          labels.push({
            text: g.n.toUpperCase(),
            x: px + 8,
            y: py,
            align: 'left',
            color: '#e879f9',
            alpha: 0.75,
          })
        }
      }

      // Gas stations: none inside the village, so bearings on the frame edge.
      const cx = rect.x + rect.w / 2
      const cy = rect.y + rect.h / 2
      for (const b of bearings) {
        const ux = Math.cos(b.bearing)
        const uy = Math.sin(b.bearing)
        const k = Math.min(
          Math.abs(rect.w / 2 / (ux || 1e-6)),
          Math.abs(rect.h / 2 / (uy || 1e-6))
        )
        const ex = cx + ux * k
        const ey = cy + uy * k
        ctx.globalAlpha = 0.8
        ctx.fillStyle = '#fbbf24'
        ctx.beginPath()
        ctx.moveTo(ex + ux * 9, ey + uy * 9)
        ctx.lineTo(ex - uy * 4, ey + ux * 4)
        ctx.lineTo(ex + uy * 4, ey - ux * 4)
        ctx.closePath()
        ctx.fill()
        const name = (b.f.n || 'Fuel').toUpperCase()
        labels.push({
          text: `${name} ${distance(b.km, state.units)}${b.count > 1 ? ` +${b.count - 1}` : ''}`,
          x: ex + ux * 16,
          y: ey + uy * 16,
          align: ux < -0.3 ? 'right' : ux > 0.3 ? 'left' : 'center',
          color: '#fbbf24',
          alpha: LABEL_ALPHA,
        })
      }

      // The shadowmen, seen by radar: dark between passes, lit as the sweep
      // crosses them, fading over the rest of the rotation. Each crossing
      // drops an afterimage that drifts and hue-shifts the higher you are.
      const radar = state.radar
      const scale = rect.w / W // px per metre
      const figure = Math.max(5, Math.min(10, 120 * scale))
      drawGhosts(time, high, radar)
      const hovered = state.pointer
        ? findHover(state.pointer, state.herds, scale, figure)
        : null
      for (const h of state.herds) {
        if (h.fade <= 0) continue
        const [hx, hy] = toPx([h.x, h.y])
        for (const m of h.members) {
          const fx = hx + m.ox * scale
          const fy = hy + m.oy * scale
          let seen = 1
          if (radar.on) {
            const since = behind(
              radar.sweep,
              Math.atan2(fy - radar.cy, fx - radar.cx)
            )
            seen = 0.14 + 0.86 * echo(since, high)
            if (m.since !== undefined && since < m.since - Math.PI) {
              ghosts.push({
                x: h.x + m.ox / W,
                y: h.y + m.oy / H,
                t: time,
                hue: (m.phase * 37) % 360,
              })
              if (ghosts.length > MAX_GHOSTS) ghosts.shift()
            }
            m.since = since
            if (since < 0.12) {
              ctx.globalAlpha = h.fade * (1 - since / 0.12)
              ctx.fillStyle =
                high > 0.4
                  ? `hsl(${(time * 60 + m.phase * 37) % 360} 100% 70%)`
                  : '#00ff41'
              ctx.beginPath()
              ctx.arc(fx, fy - figure * 0.3, figure * 1.1, 0, Math.PI * 2)
              ctx.fill()
            }
          }
          // The hovered herd stays fully visible between sweeps.
          if (hovered && hovered.h === h) seen = 1
          // Where this figure was drawn, for click hit-testing.
          m.px = fx
          m.py = fy - figure * 0.3
          m.hitR = Math.max(10, figure * 1.4)
          m.clickable = h.fade > 0.3
          drawFigure(fx, fy, figure, h.fade, seen, high, time, m)
        }
        labels.push({
          text: herdTag(h),
          x: hx + 360 * scale,
          y: hy - 320 * scale,
          align: 'left',
          color: '#f7f4ef',
          alpha:
            h.fade *
            0.5 *
            (radar.on
              ? echo(
                  behind(radar.sweep, Math.atan2(hy - radar.cy, hx - radar.cx)),
                  high
                )
              : 1),
        })
      }

      if (state.showLabels) placeLabels(labels, state.reserved || [])
      drawNameCards(time, state.herds)
      if (hovered) drawHover(state.pointer, hovered)
      ctx.globalAlpha = 1
    },
  }

  // "Mother Ostend · Tagged 14×", "· First Sighting", or "· Unrecorded" when
  // the shared record couldn't be reached.
  function nameLine(m) {
    if (!m.recorded) return `${m.name} · Unrecorded`
    return m.timesTagged > 1
      ? `${m.name} · Tagged ${m.timesTagged}×`
      : `${m.name} · First Sighting`
  }

  // Name card: for a few seconds after a tag lands, the new name floats by
  // the figure, fading out; hover brings it back.
  function drawNameCards(time, herdList) {
    for (const h of herdList) {
      for (const m of h.members) {
        if (!m.name || m.namedAt === undefined || m.px === undefined) continue
        const age = time - m.namedAt
        if (age < 0 || age > NAME_CARD_SECONDS) continue
        const fade = Math.min(1, (NAME_CARD_SECONDS - age) / 0.8)
        captionBox(m.px + 12, m.py - 30 - age * 4, nameLine(m), fade)
      }
    }
  }

  // Caption box: hard edges and an offset shadow, per the styleguide. Kept on
  // screen by flipping left/down near the edges.
  function captionBox(x, y, text, alpha = 1) {
    ctx.font = `bold 11px ${MONO}`
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'left'
    const w = ctx.measureText(text).width + 16
    const boxH = 24
    const viewW = canvas.width / dpr
    const bx = x + w > viewW - 4 ? Math.max(4, x - w - 24) : x
    const by = y < 4 ? y + 44 : y
    ctx.globalAlpha = 0.58 * alpha
    ctx.fillStyle = '#000'
    ctx.fillRect(bx + 4, by + 4, w, boxH)
    ctx.globalAlpha = 0.94 * alpha
    ctx.fillStyle = '#020617'
    ctx.fillRect(bx, by, w, boxH)
    ctx.strokeStyle = '#e879f9'
    ctx.lineWidth = 1
    ctx.strokeRect(bx + 0.5, by + 0.5, w - 1, boxH - 1)
    ctx.globalAlpha = alpha
    ctx.fillStyle = '#e879f9'
    ctx.fillText(text, bx + 8, by + boxH / 2 + 1)
  }

  // Hover: the herd under the pointer gets a ring and a count, whatever the
  // radar shows and whether or not the readout is on. The hit area is the
  // herd's current spread plus a little slack for small figures.
  function findHover(pointer, herdList, scale, figure) {
    let best = null
    let bestD = Infinity
    for (const h of herdList) {
      if (h.retiring || h.fade < 0.3) continue
      const [hx, hy] = toPx([h.x, h.y])
      let spread = 0
      for (const m of h.members)
        spread = Math.max(spread, Math.hypot(m.ox, m.oy))
      const r = spread * scale + figure * 1.5
      const d = Math.hypot(pointer.x - hx, pointer.y - hy)
      if (d <= r && d < bestD) {
        bestD = d
        best = { h, hx, hy, r }
      }
    }
    return best
  }

  function drawHover(pointer, { h, hx, hy, r }) {
    ctx.globalAlpha = 0.9
    ctx.strokeStyle = '#f7f4ef'
    ctx.lineWidth = 1
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.arc(hx, hy, r, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])

    // A named loner shows its name; a herd shows its size and how many of
    // its members have been named.
    const n = h.members.length
    const id = `#${String(h.id).padStart(2, '0')}`
    const named = h.members.filter((m) => m.name).length
    let text
    if (n === 1)
      text = h.members[0].name ? nameLine(h.members[0]) : `${id} · Alone`
    else text = `${id} · Herd of ${n}${named ? ` · ${named} Named` : ''}`
    captionBox(pointer.x + 14, pointer.y - 34, text)
  }

  // Afterimages: phosphor green when sober; at height they last longer,
  // cycle hue as they age, and smear outward from the radar centre.
  function drawGhosts(time, high, radar) {
    const life = SWEEP_SECONDS * (0.6 + 1.4 * high)
    while (ghosts.length && time - ghosts[0].t > life) ghosts.shift()
    for (const g of ghosts) {
      const age = time - g.t
      if (age < 0) continue
      const k = 1 - age / life
      let [px, py] = toPx([g.x, g.y])
      const dx = px - radar.cx
      const dy = py - radar.cy
      const d = Math.hypot(dx, dy) || 1
      const smear = age * high * 7
      px += (dx / d) * smear
      py += (dy / d) * smear
      ctx.globalAlpha = k * k * 0.75
      ctx.fillStyle =
        high > 0.15
          ? `hsl(${(g.hue + age * 80) % 360} 100% ${60 + 15 * k}%)`
          : '#00ff41'
      const r = 1.2 + 1.8 * high
      ctx.fillRect(px - r, py - r, r * 2, r * 2)
    }
  }

  function placeLabels(labels, reserved) {
    // Reserved areas (the readout box) count as already placed.
    const placed = [...reserved]

    // Street names first: rotated along their roads, with a dark halo so they
    // read over the map. Their axis-aligned bounds reserve space for the rest.
    ctx.font = `9px ${MONO}`
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.lineJoin = 'round'
    for (const s of streets) {
      const [x, y] = toPx(s.at)
      const w = ctx.measureText(s.text).width
      const hw =
        (Math.abs(Math.cos(s.angle)) * w + Math.abs(Math.sin(s.angle)) * 10) / 2
      const hh =
        (Math.abs(Math.sin(s.angle)) * w + Math.abs(Math.cos(s.angle)) * 10) / 2
      placed.push({ x0: x - hw, x1: x + hw, y0: y - hh, y1: y + hh })
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(s.angle)
      ctx.globalAlpha = 0.85
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)'
      ctx.lineWidth = 3
      ctx.strokeText(s.text, 0, 0)
      ctx.globalAlpha = 0.7
      ctx.fillStyle = '#f7f4ef'
      ctx.fillText(s.text, 0, 0)
      ctx.restore()
    }

    ctx.font = `10px ${MONO}`
    ctx.textBaseline = 'middle'
    for (const l of labels) {
      const w = ctx.measureText(l.text).width
      const x0 =
        l.align === 'right' ? l.x - w : l.align === 'center' ? l.x - w / 2 : l.x
      const box = { x0: x0 - 3, x1: x0 + w + 3, y0: l.y - 7, y1: l.y + 7 }
      // Skip a label that would run off screen rather than clip it.
      const viewW = canvas.width / dpr
      const viewH = canvas.height / dpr
      if (box.x0 < 0 || box.x1 > viewW || box.y0 < 0 || box.y1 > viewH) continue
      const clash = placed.some(
        (p) => box.x0 < p.x1 && box.x1 > p.x0 && box.y0 < p.y1 && box.y1 > p.y0
      )
      if (clash) continue
      placed.push(box)
      ctx.globalAlpha = l.alpha
      ctx.fillStyle = l.color
      ctx.textAlign = l.align
      ctx.fillText(l.text, l.x, l.y)
    }
    ctx.textAlign = 'left'
  }
}
