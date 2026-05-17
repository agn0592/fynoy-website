'use client'

import { useEffect, useState } from 'react'
import {
  loadFavorites,
  togglePositionFavorite,
  toggleClosedFavorite,
  onFavoritesChange,
} from '@/lib/favorites'

interface FavoriteToggleProps {
  kind: 'position' | 'closed'
  /** symbol for positions, composite key for closed trades */
  id: string
  /** Bigger version for buttons; default 14 */
  size?: number
}

/** Star toggle button. Filled gold when favorited. */
export default function FavoriteToggle({ kind, id, size = 14 }: FavoriteToggleProps) {
  const [active, setActive] = useState(false)

  useEffect(() => {
    const initial = loadFavorites()
    setActive(
      kind === 'position'
        ? initial.positions.includes(id)
        : initial.closedTrades.includes(id),
    )
    const unsub = onFavoritesChange((state) => {
      setActive(
        kind === 'position'
          ? state.positions.includes(id)
          : state.closedTrades.includes(id),
      )
    })
    return unsub
  }, [kind, id])

  function handle(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    if (kind === 'position') togglePositionFavorite(id)
    else toggleClosedFavorite(id)
  }

  return (
    <button
      type="button"
      onClick={handle}
      aria-label={active ? 'Verwijder uit favorieten' : 'Voeg toe aan favorieten'}
      title={active ? 'Verwijder uit favorieten' : 'Voeg toe aan favorieten'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size + 14,
        height: size + 14,
        background: 'none',
        border: 0,
        cursor: 'pointer',
        color: active ? 'var(--gold)' : 'var(--ink-dim)',
        opacity: active ? 1 : 0.7,
        padding: 0,
        borderRadius: 2,
        transition: 'color 0.15s, opacity 0.15s, transform 0.1s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '1'
        e.currentTarget.style.color = 'var(--gold)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = active ? '1' : '0.7'
        e.currentTarget.style.color = active ? 'var(--gold)' : 'var(--ink-dim)'
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transition: 'fill 0.15s' }}
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    </button>
  )
}
