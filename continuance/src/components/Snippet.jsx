// A short body excerpt centered on the first query-term hit, with matched terms
// marked. Falls back to the record summary or the head of the text.
function makeExcerpt(text, terms, radius = 120) {
  const body = text || ''
  if (!terms.length) return body.slice(0, radius * 2)

  const lower = body.toLowerCase()
  let hit = -1
  for (const term of terms) {
    const at = lower.indexOf(term.toLowerCase())
    if (at !== -1 && (hit === -1 || at < hit)) hit = at
  }
  if (hit === -1) return body.slice(0, radius * 2)

  const start = Math.max(0, hit - radius)
  const end = Math.min(body.length, hit + radius)
  return `${start > 0 ? '…' : ''}${body.slice(start, end)}${end < body.length ? '…' : ''}`
}

export default function Snippet({ text, summary, terms = [] }) {
  const source = summary || text || ''
  const excerpt =
    makeExcerpt(summary ? summary : text, terms) || source.slice(0, 240)

  if (!terms.length) return <p className="continuance-snippet">{excerpt}</p>

  // Split on the terms, keeping them as captured delimiters. Each captured part
  // equals a matched term, so membership (case-insensitive) tells us what to
  // mark - avoiding the stateful `.test()`-with-/g/ trap.
  const termSet = new Set(terms.map((t) => t.toLowerCase()))
  const pattern = new RegExp(
    `(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
    'gi'
  )
  const parts = excerpt.split(pattern)

  return (
    <p className="continuance-snippet">
      {parts.map((part, i) =>
        termSet.has(part.toLowerCase()) ? (
          <mark key={i} className="continuance-mark">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  )
}
