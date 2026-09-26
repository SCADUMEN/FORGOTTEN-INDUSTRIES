// BULL VALLEY SCADUSCOPE herds: the shadowmen's movement. The census (how
// many, and how often they travel alone) comes from density.js; this module
// decides where and how they move. A "herd" here may be a single shadowman.
//
// Where they surface — real places, fictional visitors:
//   - near the four graveyards in frame (Fairview, Ostend, Holcombville,
//     McHenry County Memorial Park)
//   - along the edges of the conservation areas and preserves
//   - in low ground: the Boone Creek bottoms and other hollows
// How they move: a slow wander, leaning downwind, drawn downhill, and — after
// dark — pulled back toward the nearest graveyard. Those only steer; speed is
// a real human pace in real time: everyone walks (1.2–1.6 m/s), and about one
// in five loners is a sprinter who runs in short bursts (5.5–7 m/s) between
// recovery walks. Herds never sprint.
//
// Positions are map units (unit square, x east, y south); motion is computed in
// metres and converted, so a herd moves at the same pace in both directions.

import { herdSize } from './density.js'

const FADE_IN = 4
const FADE_OUT = 5
const SPAWN_GAP = 0.4
const RETIRE_GAP = 1
const GOAL_EVERY = 10

// Real-time human speeds, metres per second. A stroll is ~1.4 m/s; a sprinter
// runs in bursts at a fast human pace, then walks to recover.
const WALK_MIN = 1.2
const WALK_MAX = 1.6
const SPRINT_MIN = 5.5
const SPRINT_MAX = 7
const SPRINT_SECONDS = [6, 15]
const RECOVER_SECONDS = [20, 45]
// Share of lone shadowmen who sprint. Herds never do.
const SPRINTER_SHARE = 0.2
// Fastest a member shifts within its herd, on top of the herd's own walk, so a
// figure in a herd never exceeds a normal walking pace by much.
const DRIFT_MAX = 0.6

export function createHerds({ geo, terrain, rand = Math.random }) {
  const W = geo.metres.width
  const H = geo.metres.height
  const herds = []
  let nextId = 1
  let goal = 0
  let goalAt = -Infinity
  let spawnAt = 0
  let retireAt = 0

  const edges = geo.reserves.flatMap((r) => r.p)

  function spot() {
    const roll = rand()
    if (roll < 0.35 && geo.graveyards.length) {
      const g = geo.graveyards[Math.floor(rand() * geo.graveyards.length)]
      return jitter(g.c, 250)
    }
    if (roll < 0.6 && edges.length) {
      return jitter(edges[Math.floor(rand() * edges.length)], 120)
    }
    for (let tries = 0; tries < 30; tries++) {
      const p = [0.04 + rand() * 0.92, 0.04 + rand() * 0.92]
      const low = 1 - terrain.at(p[0], p[1])
      if (rand() < low * low) return p
    }
    return [0.5, 0.5]
  }

  function jitter([x, y], metres) {
    const a = rand() * Math.PI * 2
    const d = rand() * metres
    return [
      clamp(x + (Math.cos(a) * d) / W, 0.03, 0.97),
      clamp(y + (Math.sin(a) * d) / H, 0.03, 0.97),
    ]
  }

  function spawn(high, settled = false) {
    const [x, y] = spot()
    const size = herdSize(high, rand(), rand())
    const members = []
    for (let i = 0; i < size; i++) {
      const a = (i / size) * Math.PI * 2 + rand() * 0.6
      // A loner walks the herd's centre line; a herd spreads out around it.
      const r = size === 1 ? 0 : 140 + rand() * 300
      members.push({
        sx: Math.cos(a) * r, // formation slot, metres from centre
        sy: Math.sin(a) * r,
        ox: Math.cos(a) * r,
        oy: Math.sin(a) * r,
        phase: rand() * 100,
      })
    }
    herds.push({
      id: nextId++,
      x,
      y,
      vx: 0,
      vy: 0,
      // Each sighting keeps its own walking pace; only a loner can sprint.
      pace: WALK_MIN + rand() * (WALK_MAX - WALK_MIN),
      sprinter: size === 1 && rand() < SPRINTER_SHARE,
      sprinting: false,
      // First burst comes after a short walk, so sprinters don't all bolt at once.
      nextSwitch: 3 + rand() * 20,
      heading: rand() * Math.PI * 2,
      age: settled ? FADE_IN : 0,
      life: 60 + rand() * 120,
      retiring: false,
      fade: settled ? 1 : 0,
      members,
    })
  }

  function nearestGraveyard(x, y) {
    let best = null
    let bestD = Infinity
    for (const g of geo.graveyards) {
      const d = Math.hypot((g.c[0] - x) * W, (g.c[1] - y) * H)
      if (d < bestD) {
        bestD = d
        best = g
      }
    }
    return best ? { g: best, d: bestD } : null
  }

  // env: { time, dt, high, dark, target, windTo: [x, y] metres/s }
  function update(env) {
    const { time, dt, high } = env

    if (time - goalAt >= GOAL_EVERY) {
      goal = Math.floor(env.target + rand())
      goalAt = time
    }

    const active = herds.filter((h) => !h.retiring)
    if (active.length < goal && time >= spawnAt) {
      spawn(high)
      spawnAt = time + SPAWN_GAP
    } else if (active.length > goal && time >= retireAt) {
      active.sort((a, b) => b.age - a.age)[0].retiring = true
      retireAt = time + RETIRE_GAP
    }

    for (const h of herds) {
      h.age += dt
      if (!h.retiring && h.age > h.life) h.retiring = true
      h.fade = h.retiring
        ? Math.max(0, h.fade - dt / FADE_OUT)
        : Math.min(1, h.fade + dt / FADE_IN)

      // Sprinters alternate bursts and recovery walks.
      if (h.sprinter && h.age >= h.nextSwitch) {
        h.sprinting = !h.sprinting
        const [lo, hi] = h.sprinting ? SPRINT_SECONDS : RECOVER_SECONDS
        h.nextSwitch = h.age + lo + rand() * (hi - lo)
        if (h.sprinting) {
          h.sprintSpeed = SPRINT_MIN + rand() * (SPRINT_MAX - SPRINT_MIN)
        }
      }
      const speed = h.sprinting ? h.sprintSpeed : h.pace

      // Direction only: wander, downhill, wind, and the graveyards' pull are
      // blended into a heading, and the walker covers it at their own pace.
      // None of them add speed.
      h.heading +=
        (Math.sin(time * 0.13 + h.id * 7.1) * 0.6 + (rand() - 0.5)) * dt
      let ax = Math.cos(h.heading)
      let ay = Math.sin(h.heading)

      // Downhill: they settle into hollows.
      const e = 0.004
      const gx =
        (terrain.at(h.x + e, h.y) - terrain.at(h.x - e, h.y)) / (2 * e * W)
      const gy =
        (terrain.at(h.x, h.y + e) - terrain.at(h.x, h.y - e)) / (2 * e * H)
      ax -= gx * 600
      ay -= gy * 600

      // The live wind leans them downwind (windTo is metres/s).
      ax += env.windTo[0] * 0.08
      ay += env.windTo[1] * 0.08

      // After dark, the graveyards call them back.
      const home = nearestGraveyard(h.x, h.y)
      if (home && home.d > 200 && home.d < 2500) {
        const pull = 0.6 * env.dark
        ax += (((home.g.c[0] - h.x) * W) / home.d) * pull
        ay += (((home.g.c[1] - h.y) * H) / home.d) * pull
      }

      // Stay in frame: turn back from the edges.
      const margin = 0.06
      if (h.x < margin) ax += 2
      if (h.x > 1 - margin) ax -= 2
      if (h.y < margin) ay += 2
      if (h.y > 1 - margin) ay -= 2

      const len = Math.hypot(ax, ay) || 1
      const tx = (ax / len) * speed
      const ty = (ay / len) * speed
      h.vx += (tx - h.vx) * Math.min(1, dt * 0.8)
      h.vy += (ty - h.vy) * Math.min(1, dt * 0.8)
      h.x = clamp(h.x + (h.vx * dt) / W, 0.01, 0.99)
      h.y = clamp(h.y + (h.vy * dt) / H, 0.01, 0.99)

      // Members: drift within the formation — a slow breathing of the
      // spacing and a gentle jostle. Each member walks toward its moving spot
      // at no more than DRIFT_MAX, so nobody ever snaps across the herd.
      for (const m of h.members) {
        const breathe = 1 + 0.15 * Math.sin(time * 0.02 + m.phase)
        const tx = m.sx * breathe + Math.sin(time * 0.1 + m.phase) * 10
        const ty = m.sy * breathe + Math.cos(time * 0.09 + m.phase) * 10
        const dx = tx - m.ox
        const dy = ty - m.oy
        const gap = Math.hypot(dx, dy)
        const step = Math.min(gap, Math.min(DRIFT_MAX, gap * 0.5) * dt)
        if (gap > 0) {
          m.ox += (dx / gap) * step
          m.oy += (dy / gap) * step
        }
      }
    }

    for (let i = herds.length - 1; i >= 0; i--) {
      if (herds[i].retiring && herds[i].fade <= 0) herds.splice(i, 1)
    }
  }

  // Reduced motion: populate the census immediately, fully faded in.
  function settle(target, high) {
    const count = Math.floor(target + rand())
    for (let i = 0; i < count; i++) spawn(high, true)
  }

  return {
    herds,
    update,
    settle,
    metres: { W, H },
    // Census for the readout: total figures, loners, and herds of two or more.
    census() {
      let figures = 0
      let alone = 0
      let groups = 0
      for (const h of herds) {
        if (h.retiring) continue
        figures += h.members.length
        if (h.members.length === 1) alone++
        else groups++
      }
      return { figures, alone, groups }
    },
  }
}

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n))
}
