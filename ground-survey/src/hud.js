// All DOM: readout, nerves meter, scope canvas, inventory, prompts, toasts,
// the intro/pause overlay, and the strike static. Markup is generated here so
// the Eleventy page and the dev harness stay a bare #gs-root.

function el(tag, className, html) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (html !== undefined) node.innerHTML = html
  return node
}

export class Hud {
  constructor(root) {
    this.root = root
    root.classList.add('gs-shell')

    this.canvas = el('canvas', 'gs-canvas')
    this.canvas.setAttribute('aria-hidden', 'true')
    root.appendChild(this.canvas)

    const ui = el('div', 'gs-ui')
    root.appendChild(ui)

    // Readout, in the Scaduscope's voice.
    this.head = el('section', 'gs-head')
    this.head.setAttribute('aria-label', 'Survey readout')
    this.head.innerHTML = `
      <h1><span aria-hidden="true">🥾🌚 </span>Bull Valley Ground Survey</h1>
      <dl>
        <dt>Position</dt><dd data-gs="pos">—</dd>
        <dt>Local</dt><dd data-gs="clock">—</dd>
        <dt>Road</dt><dd data-gs="road">Off road</dd>
        <dt>Contacts</dt><dd data-gs="contacts">0</dd>
      </dl>`
    ui.appendChild(this.head)

    // Nerves meter.
    this.nerves = el('div', 'gs-nerves')
    this.nerves.innerHTML = `
      <span class="gs-nerves-label">Nerves</span>
      <span class="gs-nerves-track"><i class="gs-nerves-fill"></i></span>`
    ui.appendChild(this.nerves)
    this.nervesFill = this.nerves.querySelector('.gs-nerves-fill')

    // Active effect timers.
    this.timers = el('div', 'gs-timers')
    ui.appendChild(this.timers)

    // The scope.
    this.scopeCanvas = el('canvas', 'gs-scope')
    this.scopeCanvas.setAttribute('aria-hidden', 'true')
    ui.appendChild(this.scopeCanvas)

    // Interaction prompt + toasts.
    this.promptEl = el('p', 'gs-prompt')
    this.promptEl.hidden = true
    ui.appendChild(this.promptEl)
    this.toasts = el('div', 'gs-toasts')
    this.toasts.setAttribute('aria-live', 'polite')
    ui.appendChild(this.toasts)

    // Inventory.
    this.inventory = el('section', 'gs-inventory')
    this.inventory.setAttribute('aria-label', 'Inventory')
    this.inventory.hidden = true
    this.inventory.innerHTML = `
      <h2>Inventory</h2>
      <ul>
        <li><span class="gs-item-key">1</span> Cigarettes <b data-gs="cigarettes">0</b><i>Steadies the nerves. The ember gives you away.</i></li>
        <li><span class="gs-item-key">2</span> Joints <b data-gs="joints">0</b><i>You will see them. You will feel less.</i></li>
      </ul>
      <p class="gs-inventory-hint">Tab closes. Found at fuel stations and in the reserves.</p>`
    ui.appendChild(this.inventory)

    // Vignette + strike static.
    this.vignetteEl = el('div', 'gs-vignette')
    ui.appendChild(this.vignetteEl)
    this.staticWrap = el('div', 'gs-static')
    this.staticWrap.hidden = true
    this.staticCanvas = el('canvas')
    this.staticCanvas.width = 160
    this.staticCanvas.height = 90
    this.staticWrap.appendChild(this.staticCanvas)
    this.staticWrap.appendChild(el('p', 'gs-static-label', 'SIGNAL LOST'))
    ui.appendChild(this.staticWrap)

    // Intro / pause overlay.
    this.intro = el('div', 'gs-intro')
    this.intro.setAttribute('role', 'dialog')
    this.intro.setAttribute('aria-modal', 'true')
    this.intro.innerHTML = `
      <h2 data-gs="intro-title">BULL VALLEY GROUND SURVEY</h2>
      <p class="gs-intro-note">The terrain and the roads are real.<br>The shadowmen are not, probably.<br>Do not let them get close. You cannot fight them. You can leave.</p>
      <table class="gs-controls" aria-label="Controls">
        <tr><th>WASD</th><td>Move</td><th>Shift</th><td>Run</td></tr>
        <tr><th>Mouse</th><td>Look</td><th>C</th><td>Crouch</td></tr>
        <tr><th>Q</th><td>Scaduscope</td><th>Tab</th><td>Inventory</td></tr>
        <tr><th>E</th><td>Take</td><th>1 / 2</th><td>Smoke / Spark</td></tr>
      </table>
      <div class="gs-intro-actions">
        <button type="button" class="gs-btn gs-btn--primary" data-gs="begin">Begin the Survey</button>
        <button type="button" class="gs-btn" data-gs="sound" aria-pressed="true">Sound On</button>
      </div>
      <p class="gs-intro-note gs-intro-fine">Requires a keyboard and mouse. The full Scaduscope remains at <a href="/bull-valley-scaduscope/">/bull-valley-scaduscope/</a>. <a href="/">FORGOTTEN INDUSTRIES /</a></p>`
    ui.appendChild(this.intro)
    this.beginBtn = this.intro.querySelector('[data-gs="begin"]')
    this.soundBtn = this.intro.querySelector('[data-gs="sound"]')
    this.introTitle = this.intro.querySelector('[data-gs="intro-title"]')

    this.fields = {}
    for (const dd of root.querySelectorAll('[data-gs]')) {
      this.fields[dd.dataset.gs] = dd
    }
  }

  setReadout({ pos, clock, road, contacts }) {
    if (pos !== undefined) this.fields.pos.textContent = pos
    if (clock !== undefined) this.fields.clock.textContent = clock
    if (road !== undefined) this.fields.road.textContent = road || 'Off road'
    if (contacts !== undefined) this.fields.contacts.textContent = contacts
  }

  setNerves(value, fuzzy) {
    this.nervesFill.style.width = `${value.toFixed(0)}%`
    this.nervesFill.classList.toggle('gs-nerves-fill--high', value > 70)
    this.nerves.classList.toggle('gs-nerves--fuzzy', !!fuzzy)
  }

  setTimers(lines) {
    this.timers.innerHTML = lines
      .map((line) => `<span class="gs-timer">${line}</span>`)
      .join('')
  }

  prompt(text) {
    this.promptEl.hidden = !text
    if (text) this.promptEl.textContent = text
  }

  toast(text) {
    const node = el('p', 'gs-toast', text)
    this.toasts.appendChild(node)
    setTimeout(() => node.classList.add('gs-toast--out'), 3600)
    setTimeout(() => node.remove(), 4400)
  }

  setInventory(inv) {
    this.fields.cigarettes.textContent = String(inv.cigarettes)
    this.fields.joints.textContent = String(inv.joints)
  }

  showInventory(show) {
    this.inventory.hidden = !show
    return !this.inventory.hidden
  }

  setVignette(alpha) {
    this.vignetteEl.style.opacity = alpha.toFixed(3)
  }

  showStatic(show) {
    this.staticWrap.hidden = !show
  }

  drawStatic() {
    const ctx = this.staticCanvas.getContext('2d')
    const img = ctx.createImageData(160, 90)
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255
      img.data[i] = v
      img.data[i + 1] = v
      img.data[i + 2] = v
      img.data[i + 3] = 255
    }
    ctx.putImageData(img, 0, 0)
  }

  showIntro(show, paused) {
    this.intro.hidden = !show
    if (show) {
      this.introTitle.textContent = paused
        ? 'SURVEY PAUSED'
        : 'BULL VALLEY GROUND SURVEY'
      this.beginBtn.textContent = paused ? 'Resume the Survey' : 'Begin the Survey'
    }
  }
}
