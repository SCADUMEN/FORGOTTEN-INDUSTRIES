import * as THREE from 'three'
import './styles.css'
import { CONFIG } from './config.js'
import {
  loadTerrain,
  createHeightField,
  buildTerrainMesh,
} from './terrain.js'
import { buildWorld } from './world.js'
import { Player } from './player.js'
import { Shadowmen } from './shadowmen.js'
import { Scope } from './scope.js'
import { Hud } from './hud.js'
import { GsAudio } from './audio.js'
import { stepNerves, nervesIntensity } from './nerves.js'
import {
  addItem,
  useItem,
  loadInventory,
  saveInventory,
} from './inventory.js'
import {
  worldToUnit,
  unitToLatLon,
  formatLatLon,
  pointSegmentDistance,
} from './coords.js'
import { setSnapResolution } from './ps1.js'
import { mulberry32 } from './rng.js'

// Same files the Scaduscope reads; baked by scripts/fetch_bull_valley.cjs.
const DATA_BASE = '/assets/data/bull-valley'

const PICKUP_LABEL = {
  cigarettes: 'Cigarettes ×3',
  joints: 'Joints ×2',
}

async function boot() {
  const root = document.getElementById('gs-root')
  const hud = new Hud(root)
  hud.showIntro(true, false)
  hud.beginBtn.disabled = true
  hud.beginBtn.textContent = 'Resolving Terrain…'

  let geo
  let terrain
  try {
    ;[geo, terrain] = await Promise.all([
      fetch(`${DATA_BASE}/geo.json`).then((r) => {
        if (!r.ok) throw new Error(`geo.json ${r.status}`)
        return r.json()
      }),
      loadTerrain(`${DATA_BASE}/terrain.png`),
    ])
  } catch (err) {
    console.error('Ground Survey failed to load its terrain data:', err)
    hud.beginBtn.textContent = 'The Survey Will Not Resolve'
    return
  }

  const field = createHeightField(terrain, geo)
  const heightAt = (x, z) => field.sample(x, z)

  // --- Scene -------------------------------------------------------------
  const renderer = new THREE.WebGLRenderer({
    canvas: hud.canvas,
    antialias: false,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(1)

  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#0b1018')
  scene.fog = new THREE.FogExp2('#0b1018', CONFIG.render.fogDensity)

  const camera = new THREE.PerspectiveCamera(
    72,
    window.innerWidth / window.innerHeight,
    0.1,
    CONFIG.render.far
  )

  scene.add(new THREE.HemisphereLight('#33507e', '#1a2013', 1.5))
  const moonlight = new THREE.DirectionalLight('#9db4d8', 0.9)
  moonlight.position.set(0.4, 1, -0.6)
  scene.add(moonlight)

  scene.add(buildTerrainMesh(field, geo))
  const world = buildWorld(geo, heightAt)
  scene.add(world.group)

  // Sky furniture rides along with the player so it never recedes into fog.
  const sky = new THREE.Group()
  const starRng = mulberry32(0x57a25)
  const starPositions = new Float32Array(700 * 3)
  for (let i = 0; i < 700; i++) {
    const az = starRng() * Math.PI * 2
    const el = Math.asin(starRng() * 0.95 + 0.05)
    const r = 1200
    starPositions[i * 3] = Math.cos(el) * Math.sin(az) * r
    starPositions[i * 3 + 1] = Math.sin(el) * r
    starPositions[i * 3 + 2] = Math.cos(el) * Math.cos(az) * r
  }
  const starGeo = new THREE.BufferGeometry()
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
  sky.add(
    new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({
        color: '#aab6cf',
        size: 2,
        sizeAttenuation: false,
        fog: false,
        transparent: true,
        opacity: 0.75,
      })
    )
  )
  const moonCanvas = document.createElement('canvas')
  moonCanvas.width = 64
  moonCanvas.height = 64
  const mctx = moonCanvas.getContext('2d')
  const mgrad = mctx.createRadialGradient(32, 32, 6, 32, 32, 30)
  mgrad.addColorStop(0, 'rgba(226, 232, 240, 0.95)')
  mgrad.addColorStop(0.45, 'rgba(190, 205, 228, 0.35)')
  mgrad.addColorStop(1, 'rgba(190, 205, 228, 0)')
  mctx.fillStyle = mgrad
  mctx.fillRect(0, 0, 64, 64)
  const moon = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(moonCanvas),
      fog: false,
      transparent: true,
      depthWrite: false,
    })
  )
  moon.position.set(450, 750, -680)
  moon.scale.setScalar(170)
  sky.add(moon)
  scene.add(sky)

  // --- Systems -----------------------------------------------------------
  const player = new Player({
    camera,
    heightAt,
    metres: geo.metres,
    spawn: world.spawn,
  })
  const shadowmen = new Shadowmen({
    scene,
    heightAt,
    metres: geo.metres,
    anchors: world.graveAnchors,
    playerSpawn: world.spawn,
  })
  const scope = new Scope(hud.scopeCanvas)
  const audio = new GsAudio()

  // Road segments in metres, for the readout's nearest-road line.
  const roadSegs = []
  for (const road of geo.roads) {
    if (!road.n) continue
    for (let i = 0; i < road.p.length - 1; i++) {
      roadSegs.push({
        name: road.n,
        ax: (road.p[i][0] - 0.5) * geo.metres.width,
        ay: (road.p[i][1] - 0.5) * geo.metres.height,
        bx: (road.p[i + 1][0] - 0.5) * geo.metres.width,
        by: (road.p[i + 1][1] - 0.5) * geo.metres.height,
      })
    }
  }

  // --- Game state ----------------------------------------------------------
  let inventory = loadInventory(window.localStorage)
  hud.setInventory(inventory)
  let nerves = 18
  let time = 0
  let smokingUntil = 0
  let emberUntil = 0
  let perceptionUntil = 0
  let strikeUntil = 0
  let started = false
  let inventoryOpen = false
  let nearPickup = null
  let readoutTimer = 0
  let roadTimer = 0
  let roadName = ''

  player.onEdge = () => hud.toast('The survey ends here.')
  player.onStep = (sprinting) => audio.step(sprinting)

  // --- Input ---------------------------------------------------------------
  hud.beginBtn.disabled = false
  hud.beginBtn.textContent = 'Begin the Survey'
  const startWithoutLock = () => {
    // Dev-only: headless and some embedded browsers refuse pointer lock, and
    // the survey is unwalkable without it. Never engages in production.
    if (!import.meta.env.DEV) return
    player.locked = true
    started = true
    hud.showIntro(false)
  }
  hud.beginBtn.addEventListener('click', () => {
    audio.init()
    try {
      const request = hud.canvas.requestPointerLock()
      if (request && typeof request.catch === 'function') {
        request.catch(startWithoutLock)
      }
    } catch {
      startWithoutLock()
    }
  })
  document.addEventListener('pointerlockerror', startWithoutLock)
  hud.soundBtn.addEventListener('click', () => {
    const on = hud.soundBtn.getAttribute('aria-pressed') !== 'true'
    hud.soundBtn.setAttribute('aria-pressed', String(on))
    hud.soundBtn.textContent = on ? 'Sound On' : 'Sound Off'
    audio.setMuted(!on)
  })

  document.addEventListener('pointerlockchange', () => {
    const locked = document.pointerLockElement === hud.canvas
    player.locked = locked
    if (locked) {
      started = true
      hud.showIntro(false)
    } else if (started) {
      hud.showIntro(true, true)
    }
  })
  document.addEventListener('mousemove', (e) => {
    player.handleMouse(e.movementX, e.movementY)
  })

  const useKind = (kind) => {
    if (kind === 'cigarettes' && time < smokingUntil) return
    const result = useItem(inventory, kind)
    if (!result.used) {
      hud.toast(kind === 'cigarettes' ? 'No cigarettes left.' : 'No joints left.')
      return
    }
    inventory = result.inv
    hud.setInventory(inventory)
    saveInventory(window.localStorage, inventory)
    audio.use(kind)
    if (kind === 'cigarettes') {
      smokingUntil = time + CONFIG.items.cigaretteSeconds
      emberUntil = smokingUntil + CONFIG.items.emberSeconds
      hud.toast('You light a cigarette. Breathe.')
    } else {
      perceptionUntil = time + CONFIG.items.perceptionSeconds
      hud.toast('You spark the joint. The valley sharpens.')
    }
  }

  document.addEventListener('keydown', (e) => {
    if (!player.locked) return
    player.handleKey(e.code, true)
    if (e.code === 'Tab') {
      e.preventDefault()
      inventoryOpen = hud.showInventory(!inventoryOpen)
    } else if (e.code === 'KeyQ') {
      scope.toggle()
    } else if (e.code === 'Digit1') {
      useKind('cigarettes')
    } else if (e.code === 'Digit2') {
      useKind('joints')
    } else if (e.code === 'KeyE' && nearPickup) {
      nearPickup.taken = true
      nearPickup.mesh.visible = false
      inventory = addItem(inventory, nearPickup.kind, nearPickup.count)
      hud.setInventory(inventory)
      saveInventory(window.localStorage, inventory)
      audio.pickup()
      hud.toast(`Taken: ${PICKUP_LABEL[nearPickup.kind]}`)
      nearPickup = null
      hud.prompt(null)
    }
  })
  document.addEventListener('keyup', (e) => player.handleKey(e.code, false))

  const resize = () => {
    const w = window.innerWidth
    const h = window.innerHeight
    const iw = Math.max(2, Math.floor(w / CONFIG.render.downscale))
    const ih = Math.max(2, Math.floor(h / CONFIG.render.downscale))
    renderer.setSize(iw, ih, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    setSnapResolution(iw, ih)
  }
  window.addEventListener('resize', resize)
  resize()

  const doStrike = () => {
    strikeUntil = time + 1.6
    hud.showStatic(true)
    audio.strike()
    // You come to at the nearest fuel station, lighter by one pocket.
    let dest = world.spawn
    let best = Infinity
    for (const f of world.fuelPoints) {
      const d = Math.hypot(f.x - player.pos.x, f.z - player.pos.z)
      if (d < best) {
        best = d
        dest = f
      }
    }
    player.relocate(dest.x + 3, dest.z + 3)
    const kinds = ['cigarettes', 'joints'].filter((k) => inventory[k] > 0)
    if (kinds.length) {
      const kind = kinds[Math.floor(Math.random() * kinds.length)]
      inventory = useItem(inventory, kind).inv
      hud.setInventory(inventory)
      saveInventory(window.localStorage, inventory)
    }
    nerves = 70
    setTimeout(() => {
      hud.toast('You are somewhere else. Time is missing.')
      if (kinds.length) hud.toast('Something was taken from your pockets.')
    }, 1700)
  }

  // --- Loop ----------------------------------------------------------------
  let last = performance.now()
  renderer.setAnimationLoop(() => {
    const now = performance.now()
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    time += dt

    const smoking = time < smokingUntil
    const ember = time < emberUntil
    const perception = time < perceptionUntil

    const playerState = player.update(dt, {
      speedScale:
        (scope.raised ? CONFIG.player.scopeSpeedScale : 1) *
        (smoking ? 0.85 : 1),
      swayAmp: nervesIntensity(nerves),
      driftAmp: perception ? 0.5 : 0,
    })

    const swarm = shadowmen.update(dt, playerState, { ember, perception })
    nerves = stepNerves(nerves, {
      dt,
      pressure: swarm.pressure,
      smoking,
      perception,
    })
    if (swarm.strike && time > strikeUntil) doStrike()
    if (time >= strikeUntil && !hud.staticWrap.hidden) hud.showStatic(false)
    if (time < strikeUntil) hud.drawStatic()

    hud.setNerves(nerves, perception)
    hud.setVignette(nervesIntensity(nerves) * 0.9)

    const timers = []
    if (smoking) timers.push(`Smoking ${Math.ceil(smokingUntil - time)}s`)
    else if (ember) timers.push(`Ember ${Math.ceil(emberUntil - time)}s`)
    if (perception)
      timers.push(`Perception ${Math.ceil(perceptionUntil - time)}s`)
    hud.setTimers(timers)

    audio.setPresence(Math.min(1, swarm.pressure / 2))
    audio.setHeartbeat(nervesIntensity(nerves))
    audio.update(dt)
    scope.draw(dt, {
      contacts: swarm.contacts,
      forward: playerState.forward,
      nerves,
      perception,
    })

    // Pickups: pulse, and offer the nearest within reach.
    nearPickup = null
    let bestPickup = 2.6
    for (const pickup of world.pickups) {
      if (pickup.taken) continue
      pickup.mesh.material.emissiveIntensity = 0.35 + Math.sin(time * 3) * 0.2
      const d = Math.hypot(pickup.x - player.pos.x, pickup.z - player.pos.z)
      if (d < bestPickup) {
        bestPickup = d
        nearPickup = pickup
      }
    }
    hud.prompt(
      nearPickup && player.locked
        ? `E — Take ${PICKUP_LABEL[nearPickup.kind]}`
        : null
    )

    // Readout, throttled.
    readoutTimer -= dt
    roadTimer -= dt
    if (roadTimer <= 0) {
      roadTimer = 1
      roadName = ''
      let bestRoad = 14
      for (const seg of roadSegs) {
        const d = pointSegmentDistance(
          player.pos.x,
          player.pos.z,
          seg.ax,
          seg.ay,
          seg.bx,
          seg.by
        )
        if (d < bestRoad) {
          bestRoad = d
          roadName = seg.name
        }
      }
    }
    if (readoutTimer <= 0) {
      readoutTimer = 0.25
      const { u, v } = worldToUnit(player.pos.x, player.pos.z, geo.metres)
      hud.setReadout({
        pos: formatLatLon(unitToLatLon(u, v, geo.bbox)),
        clock: new Date().toLocaleTimeString('en-US', {
          hour12: false,
          timeZone: 'America/Chicago',
        }),
        road: roadName,
        contacts: String(swarm.contacts.length),
      })
    }

    sky.position.set(player.pos.x, 0, player.pos.z)
    renderer.render(scene, camera)
  })

  if (import.meta.env.DEV) {
    // Dev-only introspection hook; stripped from production bundles.
    window.__gs = { scene, camera, renderer, player, world, shadowmen }
  }
}

boot()
