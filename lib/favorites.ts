/**
 * Client-side favorites store. Persists which open positions and closed
 * trades the member has starred in localStorage.
 *
 * Open positions are identified by symbol (the natural unique key for a
 * live holding). Closed trades are identified by a composite key
 * `${symbol}|${entry_date}|${exit_date}` since the same symbol can be
 * traded multiple times.
 */

export interface FavoritesState {
  positions: string[]      // symbol values
  closedTrades: string[]   // composite keys
}

const KEY = 'fynoy-favorites'
const EVENT = 'fynoy:favorites-changed'

export function emptyFavorites(): FavoritesState {
  return { positions: [], closedTrades: [] }
}

export function closedTradeKey(symbol: string, entryDate: string | null, exitDate: string | null): string {
  return `${symbol}|${entryDate ?? ''}|${exitDate ?? ''}`
}

export function loadFavorites(): FavoritesState {
  if (typeof window === 'undefined') return emptyFavorites()
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return emptyFavorites()
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return emptyFavorites()
    const positions = Array.isArray(parsed.positions) ? parsed.positions.filter((v: unknown) => typeof v === 'string') : []
    const closedTrades = Array.isArray(parsed.closedTrades) ? parsed.closedTrades.filter((v: unknown) => typeof v === 'string') : []
    return { positions, closedTrades }
  } catch {
    return emptyFavorites()
  }
}

export function saveFavorites(state: FavoritesState): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state))
    window.dispatchEvent(new CustomEvent<FavoritesState>(EVENT, { detail: state }))
  } catch { /* private mode */ }
}

export function togglePositionFavorite(symbol: string): FavoritesState {
  const state = loadFavorites()
  const has = state.positions.includes(symbol)
  const next: FavoritesState = {
    ...state,
    positions: has
      ? state.positions.filter(s => s !== symbol)
      : [...state.positions, symbol],
  }
  saveFavorites(next)
  return next
}

export function toggleClosedFavorite(key: string): FavoritesState {
  const state = loadFavorites()
  const has = state.closedTrades.includes(key)
  const next: FavoritesState = {
    ...state,
    closedTrades: has
      ? state.closedTrades.filter(s => s !== key)
      : [...state.closedTrades, key],
  }
  saveFavorites(next)
  return next
}

/** Subscribe to changes — returns unsubscribe fn. */
export function onFavoritesChange(cb: (state: FavoritesState) => void): () => void {
  if (typeof window === 'undefined') return () => undefined
  function handler(e: Event) {
    const detail = (e as CustomEvent<FavoritesState>).detail
    if (detail) cb(detail)
  }
  window.addEventListener(EVENT, handler)
  // Also listen to storage events so multiple tabs stay in sync
  function storageHandler(e: StorageEvent) {
    if (e.key === KEY) cb(loadFavorites())
  }
  window.addEventListener('storage', storageHandler)
  return () => {
    window.removeEventListener(EVENT, handler)
    window.removeEventListener('storage', storageHandler)
  }
}
