if (globalThis.top !== globalThis.self) {
  document.documentElement.replaceChildren()
  throw new Error('Restricted briefing refuses framed execution.')
}

const form = document.querySelector('#restricted-access-form')
const gate = document.querySelector('#restricted-access-gate')
const input = document.querySelector('#restricted-passphrase')
const status = document.querySelector('#restricted-access-status')
const content = document.querySelector('#restricted-briefing-content')
const lockRow = document.querySelector('#restricted-lock-row')
const lockButton = document.querySelector('#restricted-lock')
const submitButton = form?.querySelector('button[type="submit"]')

const decoder = new TextDecoder()
const encoder = new TextEncoder()

const allowedElements = new Set([
  'A',
  'ARTICLE',
  'DIV',
  'EM',
  'FOOTER',
  'H2',
  'H3',
  'HEADER',
  'LI',
  'NAV',
  'OL',
  'P',
  'SECTION',
  'STRONG',
  'TABLE',
  'TBODY',
  'TD',
  'TH',
  'THEAD',
  'TR',
  'UL',
])
const blockedElements = new Set([
  'BASE',
  'BUTTON',
  'EMBED',
  'FORM',
  'IFRAME',
  'INPUT',
  'LINK',
  'META',
  'OBJECT',
  'SCRIPT',
  'STYLE',
  'TEMPLATE',
])
const allowedAttributes = new Set([
  'aria-label',
  'aria-labelledby',
  'class',
  'id',
  'role',
  'tabindex',
])

function fromBase64(value) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0))
}

function sanitizeBriefingHtml(plaintext) {
  const parsed = new DOMParser().parseFromString(plaintext, 'text/html')

  for (const element of parsed.body.querySelectorAll('*')) {
    if (blockedElements.has(element.tagName)) {
      element.remove()
      continue
    }

    if (!allowedElements.has(element.tagName)) {
      element.replaceWith(...element.childNodes)
      continue
    }

    for (const attribute of [...element.attributes]) {
      if (element.tagName === 'A' && attribute.name === 'href') continue
      if (!allowedAttributes.has(attribute.name)) {
        element.removeAttribute(attribute.name)
      }
    }

    if (element.tagName === 'A') {
      const href = element.getAttribute('href')

      if (href?.startsWith('#')) continue

      try {
        const url = new URL(href, globalThis.location.href)
        if (
          !['http:', 'https:'].includes(url.protocol) ||
          url.username ||
          url.password
        ) {
          throw new Error('Unsafe briefing link.')
        }
        element.href = url.href
        element.rel = 'noopener noreferrer'
      } catch {
        element.removeAttribute('href')
      }
    }
  }

  const fragment = document.createDocumentFragment()
  fragment.append(...parsed.body.childNodes)
  return fragment
}

async function deriveKey(passphrase, payload) {
  const material = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: payload.kdf,
      hash: payload.digest,
      salt: fromBase64(payload.salt),
      iterations: payload.iterations,
    },
    material,
    { name: payload.algorithm, length: 256 },
    false,
    ['decrypt']
  )
}

async function decryptBriefing(passphrase) {
  const response = await fetch('/assets/restricted/phase-2-briefing.json', {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('The encrypted payload is unavailable.')
  }

  const payload = await response.json()
  const key = await deriveKey(passphrase, payload)
  const plaintext = await crypto.subtle.decrypt(
    {
      name: payload.algorithm,
      iv: fromBase64(payload.iv),
    },
    key,
    fromBase64(payload.ciphertext)
  )

  return decoder.decode(plaintext)
}

function lockBriefing() {
  content.replaceChildren()
  content.hidden = true
  lockRow.hidden = true
  gate.hidden = false
  input.value = ''
  status.textContent = 'Briefing locked. Awaiting local authorization.'
  status.classList.remove('restricted-status-error')
  input.focus()
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault()

  if (!globalThis.crypto?.subtle) {
    status.textContent = 'This browser does not support local decryption.'
    status.classList.add('restricted-status-error')
    return
  }

  submitButton.disabled = true
  status.textContent = 'Deriving key and testing payload…'
  status.classList.remove('restricted-status-error')

  try {
    const plaintext = await decryptBriefing(input.value)
    content.replaceChildren(sanitizeBriefingHtml(plaintext))
    gate.hidden = true
    content.hidden = false
    lockRow.hidden = false
    input.value = ''
    content.querySelector('[tabindex="-1"]')?.focus()
  } catch {
    status.textContent = 'Access denied. Check the passphrase and try again.'
    status.classList.add('restricted-status-error')
    input.select()
  } finally {
    submitButton.disabled = false
  }
})

lockButton?.addEventListener('click', lockBriefing)
