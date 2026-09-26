import { generateName } from '../assets/js/bull-valley-scaduscope/names.js'

const MAX_CITY = 120
const MAX_NOTE = 600
// seenAt comes from a date input (YYYY-MM-DD); the cap only bounds abuse.
const MAX_SEEN_AT = 40
const ALLOWED_COLORS = new Set(['khaki', 'green', 'gold', 'earth', 'black'])

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname === '/api/sightings') {
      if (request.method === 'GET') return listSightings(env)
      if (request.method === 'POST') return submitSighting(request, env)
      return json({ error: 'Method not allowed.' }, 405)
    }

    if (url.pathname === '/api/scaduscope/tags') {
      if (request.method === 'GET') return scaduscopeTotals(env)
      if (request.method === 'POST') return scaduscopeTag(env)
      return json({ error: 'Method not allowed.' }, 405)
    }

    // Everything else is a static asset. Requests through the assets binding
    // get the html_handling and not_found_handling (the 404 page) configured
    // in wrangler.jsonc.
    return env.ASSETS.fetch(request)
  },
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

// A stored colors column that fails to parse renders as no colors rather than
// failing the whole feed.
function parseColors(value) {
  try {
    const colors = JSON.parse(value || '[]')
    return Array.isArray(colors) ? colors : []
  } catch {
    return []
  }
}

async function listSightings(env) {
  let results
  try {
    ;({ results } = await env.DB.prepare(
      'SELECT id, city, seen_at, note, colors, logged_at FROM sightings ORDER BY seen_at DESC LIMIT 200'
    ).all())
  } catch (error) {
    console.error('listSightings failed', error)
    return json({ error: 'Sightings are unavailable right now.' }, 500)
  }

  return json({
    sightings: results.map((row) => ({
      id: row.id,
      city: row.city,
      seenAt: row.seen_at,
      note: row.note,
      colors: parseColors(row.colors),
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

  // Valid JSON can still be null, an array, or a scalar.
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
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
  const seenAt = String(body.seenAt || '')
    .trim()
    .slice(0, MAX_SEEN_AT)
  const colors = Array.isArray(body.colors)
    ? body.colors.filter((c) => ALLOWED_COLORS.has(c)).slice(0, 5)
    : []

  if (!city || !note || !seenAt || Number.isNaN(Date.parse(seenAt))) {
    return json({ error: 'City, date seen, and a note are required.' }, 400)
  }

  const id = crypto.randomUUID()
  const loggedAt = Date.now()

  try {
    await env.DB.prepare(
      'INSERT INTO sightings (id, city, seen_at, note, colors, logged_at) VALUES (?, ?, ?, ?, ?, ?)'
    )
      .bind(id, city, seenAt, note, JSON.stringify(colors), loggedAt)
      .run()
  } catch (error) {
    console.error('submitSighting failed', error)
    return json({ error: 'Could not file that report — try again.' }, 500)
  }

  return json({ ok: true, id })
}

// --- Bull Valley Scaduscope: shared tag counter ---------------------------
//
// Every click that tags a shadowman on /bull-valley-scaduscope/ adds to one
// shared total. The server decides the points, so the page's ?at= preview
// clock cannot fake the bonus: a tag is worth 1, or 2 during the witching
// hour (03:00–03:59 in Bull Valley, America/Chicago). The request carries no
// body; each POST is exactly one tag.

const BULL_VALLEY_HOUR = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Chicago',
  hour: '2-digit',
  hourCycle: 'h23',
})

export function tagPoints(now = new Date()) {
  return BULL_VALLEY_HOUR.format(now) === '03' ? 2 : 1
}

async function readTotals(env) {
  const row = await env.DB.prepare(
    'SELECT tags, points FROM scaduscope_totals WHERE id = 1'
  ).first()
  return { tags: row?.tags ?? 0, points: row?.points ?? 0 }
}

async function scaduscopeTotals(env) {
  try {
    return json(await readTotals(env))
  } catch (error) {
    console.error('scaduscopeTotals failed', error)
    return json({ error: 'The tally is unavailable right now.' }, 500)
  }
}

// Uniform [0, 1) from the Workers crypto API, for picking names.
function cryptoRandom() {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0] / 2 ** 32
}

async function scaduscopeTag(env) {
  const points = tagPoints()
  // The tagged shadowman is named here, from the curated folklore lists; the
  // name and its running tag count are kept forever.
  const name = generateName(cryptoRandom)
  const now = Date.now()
  try {
    await env.DB.prepare(
      'INSERT INTO scaduscope_totals (id, tags, points) VALUES (1, 1, ?) ' +
        'ON CONFLICT(id) DO UPDATE SET tags = tags + 1, points = points + excluded.points'
    )
      .bind(points)
      .run()
    await env.DB.prepare(
      'INSERT INTO scaduscope_names (name, tags, first_tagged_at, last_tagged_at) VALUES (?, 1, ?, ?) ' +
        'ON CONFLICT(name) DO UPDATE SET tags = tags + 1, last_tagged_at = excluded.last_tagged_at'
    )
      .bind(name, now, now)
      .run()
    const named = await env.DB.prepare(
      'SELECT tags FROM scaduscope_names WHERE name = ?'
    )
      .bind(name)
      .first()
    return json({
      ok: true,
      points,
      bonus: points > 1,
      name,
      timesTagged: named?.tags ?? 1,
      total: await readTotals(env),
    })
  } catch (error) {
    console.error('scaduscopeTag failed', error)
    return json({ error: 'That tag did not register — try again.' }, 500)
  }
}
