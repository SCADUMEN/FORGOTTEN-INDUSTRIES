// Fragment pool, weighted selection, text sheet, and slot lifecycle for ZOOT.
// Data contract: /dist/search-index.json `documents` — flat array where every
// entry carries { id, type, title, url, date, summary }.

const KIND_BY_TYPE = {
  'atlas-report': 'log',
  'voice-field-log': 'voice',
  'social-post': 'social',
  project: 'project',
  inventory: 'inventory',
}

const KIND_WEIGHT = {
  project: 4,
  manuscript: 4,
  log: 3,
  voice: 3,
  inventory: 2,
  social: 1,
}

// Tints follow archive kind colors (src/css/archive.css tokens), normalized for GL.
export const KIND_TINT = {
  inventory: [0.133, 0.827, 0.933], // --fi-cyan
  log: [0.29, 0.871, 0.502], // --fi-green
  project: [0.961, 0.62, 0.043], // --fi-gold
  social: [0.91, 0.475, 0.976], // --fi-magenta
  voice: [0.984, 0.749, 0.141], // --fi-amber
  manuscript: [0.969, 0.957, 0.937], // --fi-paper-light
}

export const KIND_LABEL = {
  inventory: 'OBJECT RECORD',
  log: 'FIELD LOG',
  project: 'PROJECT',
  social: 'SOURCE EVIDENCE',
  voice: 'VOICE LOG',
  manuscript: 'MANUSCRIPT',
}

export async function loadFragmentPool() {
  const res = await fetch('/dist/search-index.json')
  if (!res.ok) throw new Error(`search index fetch failed: ${res.status}`)
  const index = await res.json()
  const pool = []
  for (const doc of index.documents || []) {
    if (!doc || !doc.url || !doc.title) continue
    const kind = KIND_BY_TYPE[doc.type] || 'manuscript'
    const weight = KIND_WEIGHT[kind]
    const base = {
      kind,
      weight,
      url: doc.url,
      docId: doc.id || doc.url,
      title: doc.title,
      date: doc.date || '',
    }
    const titleText =
      kind === 'inventory' && doc.id ? `${doc.id} // ${doc.title}` : doc.title
    pool.push({ ...base, id: `${base.docId}:title`, text: titleText })
    const summary = typeof doc.summary === 'string' ? doc.summary.trim() : ''
    if (summary) {
      summary
        .split(/(?<=[.!?])\s+/)
        .filter((s) => s.length >= 30 && s.length <= 140)
        .slice(0, 2)
        .forEach((s, i) =>
          pool.push({ ...base, id: `${base.docId}:s${i}`, text: s })
        )
    }
  }
  if (!pool.length)
    throw new Error('search index contained no usable documents')
  return pool
}

// Weighted-random picker with a recency ring buffer so a session drifts
// through the whole archive instead of orbiting the largest kind.
export function createPicker(pool, recentMax = 24) {
  const recent = []
  return function pick() {
    const eligible = pool.filter((f) => !recent.includes(f.id))
    const source = eligible.length ? eligible : pool
    let total = 0
    for (const f of source) total += f.weight
    let r = Math.random() * total
    let chosen = source[source.length - 1]
    for (const f of source) {
      r -= f.weight
      if (r <= 0) {
        chosen = f
        break
      }
    }
    recent.push(chosen.id)
    if (recent.length > recentMax) recent.shift()
    return chosen
  }
}

const PHASE = {
  EMPTY: 'empty',
  SURFACING: 'surfacing',
  LEGIBLE: 'legible',
  DISSOLVING: 'dissolving',
}

const rand = (lo, hi) => lo + Math.random() * (hi - lo)

// Owns the offscreen 2D canvas the shader samples as uTextTex, plus the slot
// lifecycle. Sheet pixels match the GL drawing buffer; rects are exported in
// texture UV space (Y flipped at upload, so vUV = 1 - (y + h) / H).
export class FragmentSlots {
  constructor(pick, maxSlots) {
    this.pick = pick
    this.maxSlots = maxSlots
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')
    this.slots = Array.from({ length: maxSlots }, () => ({
      phase: PHASE.EMPTY,
      phaseStart: 0,
      duration: rand(0.4, 4.5), // staggered first surfacings
      fragment: null,
      rect: null, // sheet px
      reveal: 0,
      focused: false,
    }))
    this.dirty = false
  }

  resize(width, height) {
    this.canvas.width = width
    this.canvas.height = height
    // Rects were laid out for the old size; restart active slots cleanly.
    for (const slot of this.slots) {
      if (slot.phase !== PHASE.EMPTY) this.reset(slot, 0, rand(0.2, 1.5))
    }
    this.ctx.clearRect(0, 0, width, height)
    this.dirty = true
  }

  reset(slot, time, gap) {
    if (slot.rect) this.clearRect(slot.rect)
    slot.phase = PHASE.EMPTY
    slot.phaseStart = time
    slot.duration = gap
    slot.fragment = null
    slot.rect = null
    slot.reveal = 0
    slot.focused = false
    this.dirty = true
  }

  clearRect(rect) {
    this.ctx.clearRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4)
  }

  update(time) {
    for (const slot of this.slots) {
      if (slot.focused) continue
      const elapsed = time - slot.phaseStart
      if (slot.phase === PHASE.EMPTY) {
        if (elapsed >= slot.duration) this.surface(slot, time)
        slot.reveal = 0
      } else if (slot.phase === PHASE.SURFACING) {
        slot.reveal = Math.min(1, elapsed / slot.duration)
        if (elapsed >= slot.duration) {
          slot.phase = PHASE.LEGIBLE
          slot.phaseStart = time
          slot.duration = rand(6, 10)
        }
      } else if (slot.phase === PHASE.LEGIBLE) {
        slot.reveal = 1
        if (elapsed >= slot.duration) {
          slot.phase = PHASE.DISSOLVING
          slot.phaseStart = time
          slot.duration = rand(3, 4)
        }
      } else if (slot.phase === PHASE.DISSOLVING) {
        slot.reveal = Math.max(0, 1 - elapsed / slot.duration)
        if (elapsed >= slot.duration) this.reset(slot, time, rand(0.5, 2))
      }
    }
  }

  surface(slot, time) {
    const fragment = this.pick()
    const rect = this.place(fragment)
    if (!rect) {
      // Placement failed (crowded sheet) — skip a beat and retry.
      slot.phaseStart = time
      slot.duration = rand(0.5, 1.5)
      return
    }
    slot.fragment = fragment
    slot.rect = rect
    slot.phase = PHASE.SURFACING
    slot.phaseStart = time
    slot.duration = rand(3, 5)
    slot.reveal = 0
    this.draw(slot)
  }

  place(fragment) {
    const { width: W, height: H } = this.canvas
    if (!W || !H) return null
    const fontSize = Math.round(Math.min(26, Math.max(14, W * 0.011)))
    const lineHeight = Math.round(fontSize * 1.45)
    this.ctx.font = `400 ${fontSize}px 'Space Mono', ui-monospace, monospace`
    const maxWidth = Math.min(W * 0.42, fontSize * 30)
    const lines = wrap(this.ctx, fragment.text, maxWidth)
    const w = Math.ceil(
      Math.max(...lines.map((l) => this.ctx.measureText(l).width))
    )
    const h = lines.length * lineHeight
    const marginX = W * 0.05
    const marginY = H * 0.07
    const taken = this.slots.filter((s) => s.rect).map((s) => s.rect)
    for (let i = 0; i < 12; i++) {
      const x = rand(marginX, Math.max(marginX + 1, W - marginX - w))
      const y = rand(marginY, Math.max(marginY + 1, H - marginY - h))
      const candidate = { x, y, w, h, fontSize, lineHeight, lines }
      if (!taken.some((r) => intersects(candidate, r, 24))) return candidate
    }
    return null
  }

  draw(slot) {
    const { rect } = slot
    const ctx = this.ctx
    ctx.font = `400 ${rect.fontSize}px 'Space Mono', ui-monospace, monospace`
    ctx.fillStyle = '#ffffff'
    ctx.textBaseline = 'top'
    rect.lines.forEach((line, i) => {
      ctx.fillText(line, rect.x, rect.y + i * rect.lineHeight)
    })
    this.dirty = true
  }

  // Rect in texture UV space for the shader (Y flipped to match
  // UNPACK_FLIP_Y_WEBGL uploads).
  rectUV(slot) {
    const { width: W, height: H } = this.canvas
    const r = slot.rect
    return [r.x / W, 1 - (r.y + r.h) / H, r.w / W, r.h / H]
  }

  // Hit-test in sheet px (caller converts CSS px → sheet px). Returns the
  // index of the nearest visible slot within `radius`, or -1.
  hitTest(x, y, radius) {
    let best = -1
    let bestDist = radius
    this.slots.forEach((slot, i) => {
      if (!slot.rect || slot.reveal < 0.25) return
      const r = slot.rect
      const dx = Math.max(r.x - x, 0, x - (r.x + r.w))
      const dy = Math.max(r.y - y, 0, y - (r.y + r.h))
      const dist = Math.hypot(dx, dy)
      if (dist <= bestDist) {
        bestDist = dist
        best = i
      }
    })
    return best
  }

  focus(index) {
    const slot = this.slots[index]
    if (!slot || !slot.fragment) return null
    slot.focused = true
    slot.reveal = 1
    return slot.fragment
  }

  unfocus(index, time) {
    const slot = this.slots[index]
    if (!slot) return
    slot.focused = false
    slot.phase = PHASE.DISSOLVING
    slot.phaseStart = time
    slot.duration = rand(3, 4)
  }
}

function wrap(ctx, text, maxWidth) {
  const words = text.split(/\s+/)
  const lines = []
  let line = ''
  for (const word of words) {
    const attempt = line ? `${line} ${word}` : word
    if (line && ctx.measureText(attempt).width > maxWidth) {
      lines.push(line)
      line = word
    } else {
      line = attempt
    }
  }
  if (line) lines.push(line)
  return lines
}

function intersects(a, b, pad) {
  return (
    a.x - pad < b.x + b.w &&
    a.x + a.w + pad > b.x &&
    a.y - pad < b.y + b.h &&
    a.y + a.h + pad > b.y
  )
}
