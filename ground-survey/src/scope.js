import { CONFIG } from './config.js'
import { compassBearing } from './coords.js'

// The handheld Scaduscope: a north-up sweep radar in the SYSOUT voice. Blips
// light as the sweep passes and decay until it comes around again. This is the
// same instrument as /bull-valley-scaduscope/, carried into the field.

const GREEN = '#4ade80'
const MAGENTA = '#e879f9'
const SLATE = '#94a3b8'

export class Scope {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.raised = false
    this.sweep = 0
    this.size = 240
    canvas.width = this.size
    canvas.height = this.size
  }

  toggle() {
    this.raised = !this.raised
    this.canvas.classList.toggle('gs-scope--raised', this.raised)
    return this.raised
  }

  draw(dt, { contacts, forward, nerves, perception }) {
    if (!this.raised) return
    this.sweep = (this.sweep + (dt * Math.PI * 2) / CONFIG.scope.sweepSeconds) % (Math.PI * 2)
    const ctx = this.ctx
    const s = this.size
    const c = s / 2
    const r = c - 10
    ctx.clearRect(0, 0, s, s)

    // Dish
    ctx.save()
    ctx.beginPath()
    ctx.arc(c, c, r, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(2, 6, 23, 0.92)'
    ctx.fill()
    ctx.clip()

    // Rings and cross
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.25)'
    ctx.lineWidth = 1
    for (const t of [1 / 3, 2 / 3, 1]) {
      ctx.beginPath()
      ctx.arc(c, c, r * t, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.moveTo(c, 10)
    ctx.lineTo(c, s - 10)
    ctx.moveTo(10, c)
    ctx.lineTo(s - 10, c)
    ctx.stroke()

    // Sweep wedge
    const grad = ctx.createConicGradient
      ? ctx.createConicGradient(this.sweep - Math.PI / 2, c, c)
      : null
    if (grad) {
      grad.addColorStop(0, 'rgba(74, 222, 128, 0.28)')
      grad.addColorStop(0.12, 'rgba(74, 222, 128, 0)')
      grad.addColorStop(1, 'rgba(74, 222, 128, 0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(c, c, r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.7)'
    ctx.beginPath()
    ctx.moveTo(c, c)
    ctx.lineTo(
      c + Math.sin(this.sweep) * r,
      c - Math.cos(this.sweep) * r
    )
    ctx.stroke()

    // Contacts: alpha decays with angular distance behind the sweep.
    for (const contact of contacts) {
      const rad = (contact.bearing * Math.PI) / 180
      let behind = this.sweep - rad
      while (behind < 0) behind += Math.PI * 2
      const alpha = Math.max(0.08, 1 - behind / (Math.PI * 2))
      const rr = Math.min(1, contact.dist / CONFIG.scope.rangeMetres) * r
      const px = c + Math.sin(rad) * rr
      const py = c - Math.cos(rad) * rr
      ctx.fillStyle = contact.hunting ? MAGENTA : GREEN
      ctx.globalAlpha = perception ? Math.min(1, alpha + 0.3) : alpha
      ctx.fillRect(px - 2, py - 2, 4, 4)
      ctx.globalAlpha = 1
    }

    // Player facing wedge at centre.
    const yaw = (compassBearing(forward.x, forward.z) * Math.PI) / 180
    ctx.strokeStyle = SLATE
    ctx.beginPath()
    ctx.moveTo(c, c)
    ctx.lineTo(c + Math.sin(yaw) * 14, c - Math.cos(yaw) * 14)
    ctx.stroke()

    // Interference climbs with nerves.
    const flecks = Math.floor((nerves / 100) * 60)
    ctx.fillStyle = 'rgba(74, 222, 128, 0.35)'
    for (let i = 0; i < flecks; i++) {
      const a = Math.random() * Math.PI * 2
      const rr = Math.random() * r
      ctx.fillRect(c + Math.sin(a) * rr, c - Math.cos(a) * rr, 1.5, 1.5)
    }
    ctx.restore()

    // Bezel and readout line.
    ctx.strokeStyle = GREEN
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(c, c, r, 0, Math.PI * 2)
    ctx.stroke()
    ctx.font = '10px "Space Mono", monospace'
    ctx.textAlign = 'center'
    ctx.fillStyle = GREEN
    let line = 'NO CONTACT'
    let best = null
    for (const contact of contacts) {
      if (!best || contact.dist < best.dist) best = contact
    }
    if (best) {
      line = `CONTACT ${String(Math.round(best.bearing)).padStart(3, '0')}° ${Math.round(best.dist)}M`
    }
    ctx.fillText(line, c, s - 1)
  }
}
