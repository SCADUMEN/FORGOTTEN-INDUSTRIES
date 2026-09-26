import { useEffect, useState } from 'react'

// Persisted state, namespaced so CxR never collides with the rest of the
// site's storage. Reads are defensive: a corrupt, absent, or wrong-shaped value
// falls back to the initial value rather than throwing.
const PREFIX = 'continuance:v1:'

// A stored value is trusted only if it has the same shape as the initial value
// (array for array, string for string). A null initial accepts a string or
// null, which covers the column source ids.
export function matchesShape(value, initialValue) {
  if (Array.isArray(initialValue)) return Array.isArray(value)
  if (initialValue === null) return value === null || typeof value === 'string'
  return typeof value === typeof initialValue
}

export function useLocalStorage(key, initialValue) {
  const storageKey = `${PREFIX}${key}`

  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (raw === null) return initialValue
      const parsed = JSON.parse(raw)
      return matchesShape(parsed, initialValue) ? parsed : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(value))
    } catch {
      // Storage may be unavailable (private mode, quota) - degrade to
      // in-memory state rather than breaking the session.
    }
  }, [storageKey, value])

  return [value, setValue]
}
