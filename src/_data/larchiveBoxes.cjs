const observedIds = new Set([
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16,
])

module.exports = Array.from({ length: 26 }, (_, sequence) => {
  const sequenceLabel = String(sequence).padStart(3, '0')
  const id = `LE-BOX-${sequenceLabel}`

  if (sequence >= 17) {
    return {
      id,
      sequence,
      sequenceLabel,
      state: 'reserved',
      stateLabel: 'Reserved provisional',
      evidenceLabel: 'No physical claim',
      manifestLabel: 'Reserved manifest',
      ledgerLabel: 'Not assigned',
      clearance: 'C0',
    }
  }

  if (!observedIds.has(sequence)) {
    return {
      id,
      sequence,
      sequenceLabel,
      state: 'awaiting-photo',
      stateLabel: 'Image required',
      evidenceLabel: 'Current single-box image absent',
      manifestLabel: 'Local provisional manifest',
      ledgerLabel: 'Historical witness held',
      clearance: 'C1',
    }
  }

  return {
    id,
    sequence,
    sequenceLabel,
    state: sequence === 16 ? 'controlled' : 'observed',
    stateLabel:
      sequence === 16 ? 'Controlled record held' : 'Visual state held',
    evidenceLabel:
      sequence === 2
        ? 'Labelled multi-box image held'
        : 'Labelled single-box image held',
    manifestLabel: 'Local provisional manifest',
    ledgerLabel:
      sequence >= 1 && sequence <= 13
        ? 'Historical witness held'
        : 'No ledger entry assigned',
    clearance: sequence === 16 ? 'C2' : 'C1',
  }
})
