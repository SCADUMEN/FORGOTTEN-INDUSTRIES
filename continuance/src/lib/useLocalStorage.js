import { useCallback, useEffect, useState } from 'react'

// Persisted state, namespaced so CONTINUANCE never collides with the rest of
// the site's storage. Reads are defensive: a corrupt or absent value falls back
// to the initial value rather than throwing.
const PREFIX = 'continuance:v1:'

export function useLocalStorage(key, initialValue) {
  const storageKey = `${PREFIX}${key}`

  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(storageKey)
      return raw !== null ? JSON.parse(raw) : initialValue
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

  const reset = useCallback(() => setValue(initialValue), [initialValue])

  return [value, setValue, reset]
}
