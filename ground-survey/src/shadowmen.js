import * as THREE from 'three'
import { CONFIG } from './config.js'
import { compassBearing } from './coords.js'
import { mulberry32, range, pick } from './rng.js'

// The shadowmen. They are not fought — they are noticed too late. State
// machine per entity: dormant (drifting far off) → stalking (keeping distance,
// working around behind you) → hunting (closing) → strike. Staring at one
// freezes it, but staring too long provokes it.

function makeSilhouetteTexture(rng) {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  // Head
  const headR = range(rng, 5, 8)
  ctx.beginPath()
  ctx.ellipse(32 + range(rng, -2, 2), 14, headR, headR * 1.25, 0, 0, Math.PI * 2)
  ctx.fill()
  // Torso: stacked jittered slabs tapering to the hips.
  let wander = 0
  for (let y = 22; y < 96; y += 4) {
    const t = (y - 22) / 74
    wander += range(rng, -1.4, 1.4)
    wander = Math.max(-4, Math.min(4, wander))
    const w = 22 - 12 * t + range(rng, -2, 3)
    ctx.fillRect(32 - w / 2 + wander, y, w, 4.5)
  }
  // Arms: too long.
  for (const side of [-1, 1]) {
    const ax = 32 + side * range(rng, 12, 16)
    const len = range(rng, 44, 68)
    for (let y = 26; y < 26 + len; y += 4) {
      ctx.fillRect(ax + side * ((y - 26) / len) * 4, y, 3, 4.5)
    }
  }
  // Legs
  for (const side of [-1, 1]) {
    ctx.fillRect(32 + side * 5 - 2, 94, 4.5, 33)
  }
  // Ragged edges
  ctx.globalCompositeOperation = 'destination-out'
  for (let i = 0; i < 70; i++) {
    ctx.fillRect(
      range(rng, 8, 56),
      range(rng, 6, 126),
      range(rng, 1, 3),
      range(rng, 1, 3)
    )
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  return texture
}

export class Shadowmen {
  constructor({ scene, heightAt, metres, anchors, playerSpawn }) {
    this.heightAt = heightAt
    this.metres = metres
    this.rng = mulberry32(0xd06)
    this.entities = []
    this.group = new THREE.Group()
    this.group.name = 'shadowmen'
    scene.add(this.group)

    const textures = []
    for (let i = 0; i < 5; i++) textures.push(makeSilhouetteTexture(this.rng))

    const cfg = CONFIG.shadowmen
    for (let i = 0; i < cfg.count; i++) {
      const texture = pick(this.rng, textures)
      const height = range(this.rng, 2.4, 3.2)
      const main = new THREE.Mesh(
        new THREE.PlaneGeometry(height / 2, height),
        new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          alphaTest: 0.3,
          color: new THREE.Color('#07080c'),
          side: THREE.DoubleSide,
        })
      )
      // Perception aura: the same figure, additive violet, fog-proof, only
      // visible while the joint is working.
      const aura = new THREE.Mesh(
        new THREE.PlaneGeometry(height / 2 + 0.3, height + 0.5),
        new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: 0,
          color: new THREE.Color('#8b5cf6'),
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          fog: false,
          side: THREE.DoubleSide,
        })
      )
      aura.position.z = -0.02
      const node = new THREE.Group()
      node.add(main)
      node.add(aura)
      this.group.add(node)

      // Seed them at the graveyards and random far woods, never near spawn.
      let x
      let z
      do {
        if (anchors.length && this.rng() < 0.4) {
          const anchor = pick(this.rng, anchors)
          x = anchor.x + range(this.rng, -60, 60)
          z = anchor.z + range(this.rng, -60, 60)
        } else {
          x = range(this.rng, -metres.width / 2 + 50, metres.width / 2 - 50)
          z = range(this.rng, -metres.height / 2 + 50, metres.height / 2 - 50)
        }
      } while (Math.hypot(x - playerSpawn.x, z - playerSpawn.z) < 200)

      this.entities.push({
        node,
        aura,
        halfHeight: height / 2,
        pos: new THREE.Vector3(x, 0, z),
        state: 'dormant',
        waypoint: null,
        detect: 0,
        stareTime: 0,
        escapeTimer: 0,
        flickerTimer: range(this.rng, 0.3, 1.2),
        hidden: 0,
      })
    }
  }

  relocateEntity(e, player, minDist, maxDist) {
    const angle = this.rng() * Math.PI * 2
    const d = range(this.rng, minDist, maxDist)
    e.pos.x = Math.max(
      -this.metres.width / 2 + 30,
      Math.min(this.metres.width / 2 - 30, player.pos.x + Math.cos(angle) * d)
    )
    e.pos.z = Math.max(
      -this.metres.height / 2 + 30,
      Math.min(this.metres.height / 2 - 30, player.pos.z + Math.sin(angle) * d)
    )
    e.state = 'dormant'
    e.detect = 0
    e.stareTime = 0
    e.waypoint = null
  }

  update(dt, player, mods = {}) {
    const cfg = CONFIG.shadowmen
    const detectRange = cfg.detectRange * (mods.ember ? CONFIG.items.emberDetectScale : 1)
    let pressure = 0
    let anyHunting = false
    let strike = false
    let nearest = null
    const contacts = []

    for (const e of this.entities) {
      const dx = player.pos.x - e.pos.x
      const dz = player.pos.z - e.pos.z
      const d = Math.hypot(dx, dz)

      // Is the player looking at it?
      const toEntX = -dx / (d || 1)
      const toEntZ = -dz / (d || 1)
      const seen =
        d < 110 &&
        player.forward.x * toEntX + player.forward.z * toEntZ > 0.94

      let speed = 0
      let tx = e.pos.x
      let tz = e.pos.z

      if (e.state === 'dormant') {
        if (d < cfg.activateRange) {
          e.state = 'stalking'
        } else {
          if (!e.waypoint || e.pos.distanceTo(e.waypoint) < 8) {
            e.waypoint = new THREE.Vector3(
              e.pos.x + range(this.rng, -120, 120),
              0,
              e.pos.z + range(this.rng, -120, 120)
            )
          }
          tx = e.waypoint.x
          tz = e.waypoint.z
          speed = 1.2
        }
      }

      if (e.state === 'stalking') {
        // Work toward a point behind the player, at stalking distance.
        const behindX = player.pos.x - player.forward.x * cfg.stalkDistance
        const behindZ = player.pos.z - player.forward.z * cfg.stalkDistance
        tx = behindX
        tz = behindZ
        speed = cfg.stalkSpeed
        if (d < cfg.stalkDistance * 0.7) speed = 0

        if (seen) {
          speed = 0 // freezes while watched
          e.stareTime += dt
          if (e.stareTime > cfg.stareSeconds) e.state = 'hunting'
        } else {
          e.stareTime = Math.max(0, e.stareTime - dt)
        }

        // Detection: closeness × how loud the player is being.
        const moveFactor = player.sprinting
          ? 1.8
          : player.moving
            ? player.crouching
              ? 0.4
              : 1
            : 0.15
        const closeness = Math.max(0, (detectRange - d) / detectRange)
        e.detect += closeness * moveFactor * dt
        if (e.detect > cfg.detectThreshold) e.state = 'hunting'
        if (d > cfg.activateRange * 1.4) {
          e.state = 'dormant'
          e.detect = 0
        }
      }

      if (e.state === 'hunting') {
        anyHunting = true
        tx = player.pos.x
        tz = player.pos.z
        speed = cfg.huntSpeed
        if (d > cfg.escapeRange) {
          e.escapeTimer += dt
          if (e.escapeTimer > cfg.escapeSeconds) {
            this.relocateEntity(e, player, 120, 200)
            e.escapeTimer = 0
          }
        } else {
          e.escapeTimer = 0
        }
        if (d < cfg.strikeRange) {
          strike = true
          this.relocateEntity(e, player, 300, 450)
        }
      }

      if (speed > 0) {
        const mx = tx - e.pos.x
        const mz = tz - e.pos.z
        const md = Math.hypot(mx, mz) || 1
        e.pos.x += (mx / md) * speed * dt
        e.pos.z += (mz / md) * speed * dt
      }

      // Presence weight for the nerves meter.
      if (d < 90) {
        const w = (1 - d / 90) ** 2
        pressure += w * (e.state === 'hunting' ? 3 : 1)
      }

      // Billboard placement, jitter, and flicker.
      e.flickerTimer -= dt
      if (e.flickerTimer <= 0) {
        e.hidden = e.state === 'stalking' && seen ? 0.05 : 0.03
        e.flickerTimer = range(this.rng, 0.4, seen ? 0.7 : 1.6)
      }
      e.hidden = Math.max(0, e.hidden - dt)
      e.node.visible = e.hidden <= 0 && d < 500
      const y = this.heightAt(e.pos.x, e.pos.z) + e.halfHeight
      e.node.position.set(
        e.pos.x + range(this.rng, -0.03, 0.03),
        y + range(this.rng, -0.02, 0.02),
        e.pos.z + range(this.rng, -0.03, 0.03)
      )
      e.node.rotation.y = Math.atan2(dx, dz)
      e.aura.material.opacity = mods.perception ? 0.5 : 0

      if (d < CONFIG.scope.rangeMetres) {
        const bearing = compassBearing(-dx, -dz)
        contacts.push({ dist: d, bearing, hunting: e.state === 'hunting' })
        if (!nearest || d < nearest.dist) nearest = { dist: d, bearing }
      }
    }

    return {
      pressure: Math.min(3, pressure),
      anyHunting,
      strike,
      nearest,
      contacts,
    }
  }
}
