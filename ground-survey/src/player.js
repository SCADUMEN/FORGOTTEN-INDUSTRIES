import * as THREE from 'three'
import { CONFIG } from './config.js'

// First-person controller: WASD relative to yaw, Shift sprint, C crouch,
// pointer-lock mouse look, feet glued to the heightfield. The camera never
// leaves this class; main.js only reads the returned state.

export class Player {
  constructor({ camera, heightAt, metres, spawn }) {
    this.camera = camera
    this.camera.rotation.order = 'YXZ'
    this.heightAt = heightAt
    this.metres = metres
    this.pos = new THREE.Vector3(spawn.x, 0, spawn.z)
    this.yaw = spawn.yaw || 0
    this.pitch = 0
    this.vel = new THREE.Vector3()
    this.keys = new Set()
    this.locked = false
    this.bobPhase = 0
    this.prevBobSin = 0
    this.eye = CONFIG.player.eyeHeight
    this.forward = new THREE.Vector3(0, 0, -1)
    this.onStep = null
    this.onEdge = null
    this.edgeCooldown = 0
    this.time = 0
  }

  relocate(x, z, yaw) {
    this.pos.set(x, 0, z)
    if (yaw !== undefined) this.yaw = yaw
    this.vel.set(0, 0, 0)
  }

  handleKey(code, down) {
    if (down) this.keys.add(code)
    else this.keys.delete(code)
  }

  handleMouse(dx, dy) {
    if (!this.locked) return
    const s = CONFIG.player.mouseSensitivity
    this.yaw -= dx * s
    this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch - dy * s))
  }

  update(dt, mods = {}) {
    const cfg = CONFIG.player
    this.time += dt
    const sprinting =
      this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')
    const crouching = this.keys.has('KeyC')
    const ix = (this.keys.has('KeyD') ? 1 : 0) - (this.keys.has('KeyA') ? 1 : 0)
    const iz = (this.keys.has('KeyW') ? 1 : 0) - (this.keys.has('KeyS') ? 1 : 0)

    let speed = crouching
      ? cfg.crouchSpeed
      : sprinting
        ? cfg.sprintSpeed
        : cfg.walkSpeed
    speed *= mods.speedScale ?? 1

    const sin = Math.sin(this.yaw)
    const cos = Math.cos(this.yaw)
    const target = new THREE.Vector3()
    if ((ix || iz) && this.locked) {
      const inv = 1 / Math.hypot(ix, iz)
      // forward is (-sin, 0, -cos); right is (cos, 0, -sin)
      target.x = (-sin * iz + cos * ix) * inv * speed
      target.z = (-cos * iz - sin * ix) * inv * speed
    }
    const blend = Math.min(1, 10 * dt)
    this.vel.x += (target.x - this.vel.x) * blend
    this.vel.z += (target.z - this.vel.z) * blend
    this.pos.x += this.vel.x * dt
    this.pos.z += this.vel.z * dt

    // The survey square has edges; the fog just pretends it doesn't.
    const mx = this.metres.width / 2 - 8
    const mz = this.metres.height / 2 - 8
    this.edgeCooldown -= dt
    if (Math.abs(this.pos.x) > mx || Math.abs(this.pos.z) > mz) {
      this.pos.x = Math.max(-mx, Math.min(mx, this.pos.x))
      this.pos.z = Math.max(-mz, Math.min(mz, this.pos.z))
      if (this.onEdge && this.edgeCooldown <= 0) {
        this.edgeCooldown = 6
        this.onEdge()
      }
    }

    const speedNow = Math.hypot(this.vel.x, this.vel.z)
    const moving = speedNow > 0.3

    // Head bob, and a step event each time the sine bottoms out.
    this.bobPhase += speedNow * dt * 1.6
    const bobSin = Math.sin(this.bobPhase)
    if (moving && this.prevBobSin > 0 && bobSin <= 0 && this.onStep) {
      this.onStep(sprinting)
    }
    this.prevBobSin = bobSin

    const targetEye = crouching ? cfg.crouchEyeHeight : cfg.eyeHeight
    this.eye += (targetEye - this.eye) * Math.min(1, 8 * dt)
    const ground = this.heightAt(this.pos.x, this.pos.z)
    const bob = bobSin * 0.05 * Math.min(1, speedNow / 4)

    // Nerves sway (roll + pitch flutter) and weed drift (slow yaw wander).
    const sway = mods.swayAmp || 0
    const drift = mods.driftAmp || 0
    this.yaw += Math.sin(this.time * 0.31) * drift * dt
    const roll =
      Math.sin(this.time * 1.7) * 0.035 * sway +
      Math.sin(this.time * 0.47) * 0.02 * drift
    const pitchFlutter = Math.sin(this.time * 2.3) * 0.012 * sway

    this.camera.position.set(this.pos.x, ground + this.eye + bob, this.pos.z)
    this.camera.rotation.set(this.pitch + pitchFlutter, this.yaw, roll)

    this.forward.set(-sin, 0, -cos)

    return {
      pos: this.camera.position,
      forward: this.forward,
      speed: speedNow,
      moving,
      sprinting: sprinting && moving,
      crouching,
    }
  }
}
