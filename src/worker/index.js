const MAX_CITY = 120
const MAX_NOTE = 600
const ALLOWED_COLORS = new Set(['khaki', 'green', 'gold', 'earth', 'black'])

// Which confidence tags the public feed is willing to show. A report is born
// 'unverified' and is only promoted out of band, so an open intake endpoint
// can never put unreviewed text on the page. Widen this set deliberately —
// adding 'unverified' here republishes the raw submission queue.
const PUBLIC_STATUSES = ['confirmed']

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
  const placeholders = PUBLIC_STATUSES.map(() => '?').join(', ')
  const { results } = await env.DB.prepare(
    `SELECT id, city, seen_at, note, colors, status, logged_at FROM sightings WHERE status IN (${placeholders}) ORDER BY seen_at DESC LIMIT 200`
  )
    .bind(...PUBLIC_STATUSES)
    .all()

  return json({
    sightings: results.map((row) => ({
      id: row.id,
      city: row.city,
      seenAt: row.seen_at,
      note: row.note,
      colors: JSON.parse(row.colors || '[]'),
      status: row.status,
      loggedAt: row.logged_at,
    })),
  })
}

// Two ceilings, because they fail differently. The per-IP limiter stops one
// client hammering the intake; the site-wide limiter is what protects the D1
// write quota when the flood arrives from many addresses at once. Cloudflare
// counts per data centre rather than globally, so treat both as a ceiling on
// sustained abuse, not a precise quota.
async function overLimit(request, env) {
  const ip = request.headers.get('cf-connecting-ip') || 'unknown'
  const checks = [
    [env.SIGHTING_LIMIT_IP, ip],
    [env.SIGHTING_LIMIT_GLOBAL, 'sightings'],
  ]

  for (const [limiter, key] of checks) {
    // Absent in local dev, where the binding is not provisioned.
    if (!limiter) continue
    const { success } = await limiter.limit({ key })
    if (!success) return true
  }

  return false
}

async function submitSighting(request, env) {
  if (await overLimit(request, env)) {
    return json(
      { error: 'Too many reports filed just now. Try again in a minute.' },
      429
    )
  }

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

  // Status is never read from the request. A submitter files a report; they
  // do not get to say how confident the archive is about it.
  await env.DB.prepare(
    "INSERT INTO sightings (id, city, seen_at, note, colors, status, logged_at) VALUES (?, ?, ?, ?, ?, 'unverified', ?)"
  )
    .bind(id, city, seenAt, note, JSON.stringify(colors), loggedAt)
    .run()

  return json({ ok: true, id })
}
