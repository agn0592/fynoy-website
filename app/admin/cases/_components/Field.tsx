import type { ReactNode } from 'react'

interface FieldProps {
  label: string
  value: ReactNode
  spanAll?: boolean
}

export function Field({ label, value, spanAll }: FieldProps) {
  const isEmpty =
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim() === '')

  return (
    <div className={spanAll ? 'span-all' : undefined} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div
        style={{
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--ink-dim)',
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 13,
          color: 'var(--ink)',
          lineHeight: 1.55,
          whiteSpace: 'pre-wrap',
          fontFamily: 'var(--sans)',
        }}
      >
        {isEmpty ? (
          <span style={{ color: 'var(--ink-dim)', fontStyle: 'italic', fontFamily: 'var(--serif)' }}>—</span>
        ) : (
          value
        )}
      </div>
    </div>
  )
}
