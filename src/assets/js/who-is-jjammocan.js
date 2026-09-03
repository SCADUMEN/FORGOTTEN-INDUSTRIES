const form = document.querySelector('#sighting-form')
const status = document.querySelector('#sighting-status')
const submitButton = form?.querySelector('button[type="submit"]')
const feed = document.querySelector('#sighting-feed')
const feedEmpty = document.querySelector('#sighting-feed-empty')

const COLOR_LABEL = {
  khaki: 'Khaki',
  green: 'Green',
  gold: 'Distressed gold',
  earth: 'Earth',
  black: 'Black',
}

function setStatus(message, isError) {
  if (!status) return
  status.textContent = message
  status.classList.toggle('restricted-status-error', Boolean(isError))
}

function formatDate(iso) {
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return iso
  return parsed.toLocaleDateString(undefined, {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  })
}

function renderSighting(entry) {
  const item = document.createElement('li')

  const heading = document.createElement('h3')
  heading.textContent = entry.city

  const meta = document.createElement('p')
  meta.className = 'shelf-note'
  const colorList = entry.colors.map((c) => COLOR_LABEL[c] || c).join(', ')
  meta.textContent =
    formatDate(entry.seenAt) + (colorList ? ' · ' + colorList : '')

  const note = document.createElement('p')
  note.textContent = entry.note

  item.append(heading, meta, note)
  return item
}

async function loadFeed() {
  if (!feed) return
  try {
    const response = await fetch('/api/sightings')
    if (!response.ok) throw new Error('Feed request failed.')
    const { sightings } = await response.json()

    feed.replaceChildren()
    if (!sightings.length) {
      feedEmpty?.removeAttribute('hidden')
      return
    }
    feedEmpty?.setAttribute('hidden', '')
    sightings.forEach((entry) => feed.append(renderSighting(entry)))
  } catch {
    feedEmpty?.removeAttribute('hidden')
    if (feedEmpty)
      feedEmpty.textContent =
        'Reports are not reachable right now. Try reloading.'
  }
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault()
  if (!submitButton) return

  const data = new FormData(form)
  const colors = data.getAll('colors')
  const payload = {
    city: String(data.get('city') || '').trim(),
    seenAt: String(data.get('seenAt') || '').trim(),
    note: String(data.get('note') || '').trim(),
    colors,
    hp: String(data.get('hp') || ''),
  }

  if (!payload.city || !payload.seenAt || !payload.note) {
    setStatus('City, date seen, and a note are required.', true)
    return
  }

  submitButton.disabled = true
  setStatus('Filing report…', false)

  try {
    const response = await fetch('/api/sightings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Report rejected.')

    setStatus('Report filed. Thank you.', false)
    form.reset()
    loadFeed()
  } catch (error) {
    setStatus(error.message || 'Could not file that report — try again.', true)
  } finally {
    submitButton.disabled = false
  }
})

loadFeed()
