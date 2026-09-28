// Fully procedural WebAudio: wind, radio static that scales with presence,
// Geiger-style contact ticks, footsteps, a heartbeat that arrives with the
// nerves, and item sounds. No audio files ship with the game.

export class GsAudio {
  constructor() {
    this.ctx = null
    this.muted = false
    this.tickTimer = 1
    this.heartTimer = 0
    this.presence = 0
    this.heartbeat = 0
  }

  // Must be called from a user gesture.
  init() {
    if (this.ctx) {
      this.ctx.resume()
      return
    }
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    this.ctx = ctx
    this.master = ctx.createGain()
    this.master.gain.value = this.muted ? 0 : 0.8
    this.master.connect(ctx.destination)

    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    this.noiseBuffer = noiseBuffer

    // Wind: looped noise through a slow-wobbling lowpass.
    const wind = ctx.createBufferSource()
    wind.buffer = noiseBuffer
    wind.loop = true
    const windFilter = ctx.createBiquadFilter()
    windFilter.type = 'lowpass'
    windFilter.frequency.value = 320
    const windGain = ctx.createGain()
    windGain.gain.value = 0.05
    wind.connect(windFilter).connect(windGain).connect(this.master)
    wind.start()
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.11
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 140
    lfo.connect(lfoGain).connect(windFilter.frequency)
    lfo.start()

    // Static bed: gain driven by shadowman presence.
    const stat = ctx.createBufferSource()
    stat.buffer = noiseBuffer
    stat.loop = true
    const statFilter = ctx.createBiquadFilter()
    statFilter.type = 'highpass'
    statFilter.frequency.value = 1400
    this.staticGain = ctx.createGain()
    this.staticGain.gain.value = 0
    stat.connect(statFilter).connect(this.staticGain).connect(this.master)
    stat.start()
  }

  setMuted(muted) {
    this.muted = muted
    if (this.master) this.master.gain.value = muted ? 0 : 0.8
  }

  burst({ duration, filterType, frequency, gain, sweepTo }) {
    if (!this.ctx) return
    const ctx = this.ctx
    const src = ctx.createBufferSource()
    src.buffer = this.noiseBuffer
    const filter = ctx.createBiquadFilter()
    filter.type = filterType
    filter.frequency.value = frequency
    if (sweepTo) {
      filter.frequency.linearRampToValueAtTime(sweepTo, ctx.currentTime + duration)
    }
    const env = ctx.createGain()
    env.gain.setValueAtTime(gain, ctx.currentTime)
    env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    src.connect(filter).connect(env).connect(this.master)
    src.start(ctx.currentTime, Math.random(), duration + 0.05)
  }

  tone({ frequency, duration, gain, type = 'sine', sweepTo }) {
    if (!this.ctx) return
    const ctx = this.ctx
    const osc = ctx.createOscillator()
    osc.type = type
    osc.frequency.value = frequency
    if (sweepTo) {
      osc.frequency.exponentialRampToValueAtTime(sweepTo, ctx.currentTime + duration)
    }
    const env = ctx.createGain()
    env.gain.setValueAtTime(gain, ctx.currentTime)
    env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(env).connect(this.master)
    osc.start()
    osc.stop(ctx.currentTime + duration + 0.05)
  }

  step(sprinting) {
    this.burst({
      duration: 0.07,
      filterType: 'lowpass',
      frequency: 260,
      gain: sprinting ? 0.16 : 0.1,
    })
  }

  use(kind) {
    // Lighter flick ×2, then the joint gets a longer crackle.
    this.burst({ duration: 0.03, filterType: 'highpass', frequency: 2400, gain: 0.2 })
    setTimeout(
      () =>
        this.burst({ duration: 0.05, filterType: 'highpass', frequency: 2000, gain: 0.25 }),
      120
    )
    if (kind === 'joints') {
      setTimeout(
        () =>
          this.burst({ duration: 0.5, filterType: 'bandpass', frequency: 900, gain: 0.12 }),
        350
      )
    }
  }

  pickup() {
    this.tone({ frequency: 660, duration: 0.09, gain: 0.08, type: 'square' })
    this.tone({ frequency: 880, duration: 0.14, gain: 0.06, type: 'square' })
  }

  strike() {
    this.burst({ duration: 1.1, filterType: 'highpass', frequency: 600, gain: 0.5 })
    this.tone({ frequency: 220, sweepTo: 38, duration: 1.2, gain: 0.3, type: 'sawtooth' })
  }

  setPresence(presence) {
    this.presence = Math.max(0, Math.min(1, presence))
    if (this.staticGain) {
      this.staticGain.gain.value = this.presence * 0.22
    }
  }

  setHeartbeat(intensity) {
    this.heartbeat = Math.max(0, Math.min(1, intensity))
  }

  update(dt) {
    if (!this.ctx) return
    // Contact ticks, Geiger-paced by presence.
    this.tickTimer -= dt * (0.15 + this.presence * 7)
    if (this.tickTimer <= 0) {
      this.tone({ frequency: 1700, duration: 0.03, gain: 0.05, type: 'square' })
      this.tickTimer = 0.6 + Math.random()
    }
    // Heartbeat: lub-dub, faster as intensity climbs.
    if (this.heartbeat > 0.2) {
      this.heartTimer -= dt
      if (this.heartTimer <= 0) {
        this.tone({ frequency: 52, duration: 0.11, gain: 0.3 })
        setTimeout(
          () => this.tone({ frequency: 48, duration: 0.09, gain: 0.2 }),
          180
        )
        this.heartTimer = 1.25 - this.heartbeat * 0.7
      }
    }
  }
}
