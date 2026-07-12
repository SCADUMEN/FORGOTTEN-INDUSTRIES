const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const GENESIS_HASH = '0'.repeat(64)
const logPath = path.resolve(__dirname, '..', '..', 'HASH', 'counter_log.json')

function canonicalJson(data) {
  return JSON.stringify(
    Object.keys(data)
      .sort()
      .reduce((record, key) => {
        record[key] = data[key]
        return record
      }, {})
  )
}

function recordPayload(entry) {
  return {
    entry: entry.entry,
    count: entry.count,
    timestamp_utc: entry.timestamp_utc,
    note: entry.note,
    previous_hash: entry.previous_hash,
  }
}

function hashRecord(entry) {
  return crypto
    .createHash('sha256')
    .update(canonicalJson(recordPayload(entry)), 'utf8')
    .digest('hex')
}

function sha256Text(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex')
}

function readEntries() {
  if (!fs.existsSync(logPath)) {
    return []
  }

  const entries = JSON.parse(fs.readFileSync(logPath, 'utf8'))
  if (!Array.isArray(entries)) {
    throw new Error(`${logPath} must contain a JSON list.`)
  }

  let expectedPrevious = GENESIS_HASH
  entries.forEach((entry, index) => {
    const entryNumber = index + 1
    const missing = [
      'entry',
      'count',
      'timestamp_utc',
      'note',
      'previous_hash',
      'hash',
    ].filter((key) => !(key in entry))

    if (missing.length) {
      throw new Error(
        `Counter entry ${entryNumber} is missing: ${missing.join(', ')}`
      )
    }

    if (entry.entry !== entryNumber) {
      throw new Error(`Counter entry numbering breaks at ${entryNumber}.`)
    }

    if (entry.previous_hash !== expectedPrevious) {
      throw new Error(`Counter previous-hash link breaks at ${entryNumber}.`)
    }

    const calculated = hashRecord(entry)
    if (entry.hash !== calculated) {
      throw new Error(`Counter hash mismatch at ${entryNumber}.`)
    }

    expectedPrevious = entry.hash
  })

  return entries
}

const entries = readEntries()

module.exports = {
  entries: entries.map((entry) => {
    const statement = `eat pill kill god ${entry.count}`

    return {
      count: entry.count,
      statement,
      statementHash: sha256Text(statement),
      chainHash: entry.hash,
    }
  }),
  latestHash: entries.at(-1)?.hash || '',
}
