/**
 * "Vistos recientemente" — persistencia ligera en localStorage (solo cliente).
 * Guarda un historial corto de productos visitados, sin tocar el backend.
 */

export type RecentItem = {
  id: string
  handle: string
  title: string
  image?: string | null
  price: number
  currencyCode?: string
}

const KEY = 'smartime_recently_viewed'
const MAX = 8

export function getRecentlyViewed(): RecentItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    // Robustez: si el dato en localStorage está corrupto (no es un array),
    // devolvemos [] para que ningún consumidor reciba algo distinto de un array.
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as RecentItem[]) : []
  } catch {
    return []
  }
}

/** Registra un producto como visto (lo pone primero, deduplica por id, recorta a MAX). */
export function recordRecentlyViewed(item: RecentItem): void {
  if (typeof window === 'undefined') return
  try {
    const prev = getRecentlyViewed().filter((i) => i.id !== item.id)
    const next = [item, ...prev].slice(0, MAX)
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* noop */
  }
}
