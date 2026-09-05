const MAX_CITY = 120
const MAX_NOTE = 600
const ALLOWED_COLORS = new Set(['khaki', 'green', 'gold', 'earth', 'black'])

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname === '/api/sightings') {
      if (request.method === 'GET') return listSightings(env)
      if (request.method === 'POST') return submitSighting(request, env)
      return json({ error: 'Method not allowed.' }, 405)
    }

    // Any path that isn't a static asset (including a genuine 404) reaches
    // this handler rather than the platform's asset routing, so the site's
    // configured 404 page has to be replicated explicitly here.
    return env.ASSETS.fetch(request)
  },
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

async function listSightings(env) {
  const { results } = await env.DB.prepare(
    'SELECT id, city, seen_at, note, colors, logged_at FROM sightings ORDER BY seen_at DESC LIMIT 200'
  ).all()

  return json({
    sightings: results.map((row) => ({
      id: row.id,
      city: row.city,
      seenAt: row.seen_at,
      note: row.note,
      colors: JSON.parse(row.colors || '[]'),
      loggedAt: row.logged_at,
    })),
  })
}

async function submitSighting(request, env) {
  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Malformed request.' }, 400)
  }

  // Honeypot: a real visitor never fills a field hidden from view. Report
  // success without writing, so a bot gets no signal that it was caught.
  if (typeof body.hp === 'string' && body.hp.trim() !== '') {
    return json({ ok: true })
  }

  const city = String(body.city || '')
    .trim()
    .slice(0, MAX_CITY)
  const note = String(body.note || '')
    .trim()
    .slice(0, MAX_NOTE)
  const seenAt = String(body.seenAt || '').trim()
  const colors = Array.isArray(body.colors)
    ? body.colors.filter((c) => ALLOWED_COLORS.has(c)).slice(0, 5)
    : []

  if (!city || !note || !seenAt || Number.isNaN(Date.parse(seenAt))) {
    return json({ error: 'City, date seen, and a note are required.' }, 400)
  }

  const id = crypto.randomUUID()
  const loggedAt = Date.now()

  await env.DB.prepare(
    'INSERT INTO sightings (id, city, seen_at, note, colors, logged_at) VALUES (?, ?, ?, ?, ?, ?)'
  )
    .bind(id, city, seenAt, note, JSON.stringify(colors), loggedAt)
    .run()

  return json({ ok: true, id })
}
