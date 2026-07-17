// Cross-referencing: given a record from one column, find the records in the
// other column that share the most meaning. v1 scoring is deliberately simple
// and explainable - shared significant terms plus tag overlap - so a result can
// always be justified by the terms it matched on.

const STOPWORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'but',
  'of',
  'to',
  'in',
  'on',
  'for',
  'with',
  'as',
  'at',
  'by',
  'from',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'this',
  'that',
  'these',
  'those',
  'it',
  'its',
  'into',
  'than',
  'then',
  'so',
  'not',
  'no',
  'can',
  'will',
  'would',
  'should',
  'could',
  'has',
  'have',
  'had',
  'their',
  'they',
  'them',
  'his',
  'her',
  'our',
  'your',
  'you',
  'we',
  'i',
])

export function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .split(/[^a-z0-9-]+/)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token))
}

// A record's term set weights title and tags above body text, so a shared
// subject counts for more than a shared common word buried in prose.
function termWeights(record) {
  const weights = new Map()
  const add = (text, weight) => {
    for (const token of tokenize(text)) {
      weights.set(token, Math.max(weights.get(token) || 0, weight))
    }
  }
  add(record.title, 3)
  for (const tag of record.tags || []) add(tag, 3)
  add(record.summary, 2)
  add(record.text, 1)
  return weights
}

const tagSet = (record) =>
  new Set((record.tags || []).map((tag) => String(tag).toLowerCase()))

export function scorePair(a, b) {
  const wa = termWeights(a)
  const wb = termWeights(b)

  let termScore = 0
  const shared = []
  for (const [token, weight] of wa) {
    if (wb.has(token)) {
      termScore += weight * wb.get(token)
      shared.push(token)
    }
  }

  const tagsA = tagSet(a)
  const tagsB = tagSet(b)
  const sharedTags = [...tagsA].filter((tag) => tagsB.has(tag))

  return {
    score: termScore + sharedTags.length * 5,
    sharedTerms: shared
      .sort((x, y) => (wb.get(y) || 0) - (wb.get(x) || 0))
      .slice(0, 8),
    sharedTags,
  }
}

// Related records in `targetRecords`, best first. Excludes the record itself
// (by id) so cross-referencing a source against itself never self-matches.
export function relatedRecords(record, targetRecords, limit = 10) {
  if (!record) return []
  return targetRecords
    .filter((target) => target.id !== record.id)
    .map((target) => ({ record: target, ...scorePair(record, target) }))
    .filter((entry) => entry.score > 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, limit)
}
