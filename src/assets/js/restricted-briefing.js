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

function fromBase64(value) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0))
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
    content.innerHTML = plaintext
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
