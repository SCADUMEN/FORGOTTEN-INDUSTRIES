// Inventory state: pure transforms plus a localStorage adapter. The storage
// handle is injected so tests can pass a stub and the browser can pass
// window.localStorage; every touch of real storage is wrapped in try/catch
// (private windows, blocked site data).

export const STARTING_INVENTORY = { cigarettes: 2, joints: 1 }

const KEY = 'ground-survey:v1:inventory'

export function addItem(inv, kind, count = 1) {
  return { ...inv, [kind]: (inv[kind] || 0) + count }
}

export function useItem(inv, kind) {
  if (!inv[kind] || inv[kind] <= 0) return { inv, used: false }
  return { inv: { ...inv, [kind]: inv[kind] - 1 }, used: true }
}

export function loadInventory(storage) {
  try {
    const raw = storage.getItem(KEY)
    if (!raw) return { ...STARTING_INVENTORY }
    const parsed = JSON.parse(raw)
    return {
      cigarettes: Math.max(0, parsed.cigarettes | 0),
      joints: Math.max(0, parsed.joints | 0),
    }
  } catch {
    return { ...STARTING_INVENTORY }
  }
}

export function saveInventory(storage, inv) {
  try {
    storage.setItem(KEY, JSON.stringify(inv))
  } catch {
    // Storage can be unavailable; the run simply doesn't persist.
  }
}
