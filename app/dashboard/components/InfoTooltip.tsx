'use client'

import { useEffect, useRef, useState } from 'react'
import { getGlossaryEntry, type GlossaryEntry } from '@/lib/glossary'

interface InfoTooltipProps {
  /** Glossary key — see lib/glossary.ts */
  term: string
  /** Optional inline override for the explanation (uses this instead of glossary lookup). */
  title?: string
  body?: string
  example?: string
  /** Visual size of the info "i" trigger. Default 12. */
  size?: number
  /** Push tooltip up/left so it doesn't get clipped by parent boxes. Default 'auto'. */
  placement?: 'auto' | 'top' | 'bottom' | 'left' | 'right'
  /** Extra inline style for the trigger circle. */
  style?: React.CSSProperties
  /** Make the trigger inherit color of context (e.g. for labels in white text). Default false → gold. */
  inheritColor?: boolean
}

/**
 * Small accessible info icon. Hover on desktop, click on mobile.
 * Looks up term from the glossary unless explicit title/body override is given.
 */
export default function InfoTooltip({
  term, title, body, example,
  size = 12,
  placement = 'auto',
  style,
  inheritColor = false,
}: InfoTooltipProps) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLSpanElement>(null)
  const [actualPlacement, setActualPlacement] = useState<'top' | 'bottom' | 'left' | 'right'>('top')

  // Resolve content
  const fromGlossary: GlossaryEntry | null = term ? getGlossaryEntry(term) : null
  const finalTitle = title ?? fromGlossary?.title ?? term
  const finalBody = body ?? fromGlossary?.body ?? ''
  const finalExample = example ?? fromGlossary?.example

  // Close on outside click / escape
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent | TouchEvent) {
      const target = e.target as Node
      if (wrapRef.current && !wrapRef.current.contains(target)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown, { passive: true })
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Auto-placement: pick top, fall back to bottom if too close to top
  useEffect(() => {
    if (!open || placement !== 'auto') {
      if (placement !== 'auto') setActualPlacement(placement)
      return
    }
    const el = wrapRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const spaceAbove = rect.top
    const spaceBelow = window.innerHeight - rect.bottom
    setActualPlacement(spaceAbove > 220 || spaceAbove > spaceBelow ? 'top' : 'bottom')
  }, [open, placement])

  const triggerStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: size + 2,
    height: size + 2,
    minWidth: size + 2,
    borderRadius: '50%',
    border: `1px solid ${inheritColor ? 'currentColor' : 'var(--gold-line)'}`,
    color: inheritColor ? 'currentColor' : 'var(--gold)',
    background: inheritColor ? 'transparent' : 'rgba(201,169,110,0.06)',
    fontFamily: 'var(--serif)',
    fontSize: Math.max(8, size - 4),
    fontWeight: 700,
    lineHeight: 1,
    cursor: 'help',
    userSelect: 'none',
    marginLeft: 4,
    transition: 'background 0.15s, border-color 0.15s, color 0.15s',
    flexShrink: 0,
    opacity: 0.78,
    ...style,
  }

  // Popover positioning
  const popoverStyle: React.CSSProperties = {
    position: 'absolute',
    width: 'min(280px, calc(100vw - 32px))',
    background: 'var(--navy-2)',
    border: '1px solid var(--gold-line)',
    borderRadius: 4,
    boxShadow: '0 10px 32px rgba(0,0,0,0.5)',
    padding: '12px 14px',
    zIndex: 800,
    fontFamily: 'var(--sans)',
    textAlign: 'left',
    whiteSpace: 'normal',
    letterSpacing: 0,
    textTransform: 'none',
    fontWeight: 400,
    cursor: 'default',
    pointerEvents: 'auto',
    color: 'var(--ink-mute)',
    animation: 'tooltipIn 0.14s cubic-bezier(0.16,1,0.3,1)',
  }
  if (actualPlacement === 'top') {
    popoverStyle.bottom = 'calc(100% + 8px)'
    popoverStyle.left = '50%'
    popoverStyle.transform = 'translateX(-50%)'
  } else if (actualPlacement === 'bottom') {
    popoverStyle.top = 'calc(100% + 8px)'
    popoverStyle.left = '50%'
    popoverStyle.transform = 'translateX(-50%)'
  } else if (actualPlacement === 'left') {
    popoverStyle.right = 'calc(100% + 8px)'
    popoverStyle.top = '50%'
    popoverStyle.transform = 'translateY(-50%)'
  } else if (actualPlacement === 'right') {
    popoverStyle.left = 'calc(100% + 8px)'
    popoverStyle.top = '50%'
    popoverStyle.transform = 'translateY(-50%)'
  }

  return (
    <span
      ref={wrapRef}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
    >
      <button
        type="button"
        aria-label={`Info: ${finalTitle}`}
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen((o) => !o)
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        style={triggerStyle}
        className="info-tooltip-trigger"
      >
        i
      </button>

      {open && finalBody && (
        <span
          role="tooltip"
          style={popoverStyle}
          onClick={(e) => e.stopPropagation()}
        >
          <span style={{
            display: 'block',
            color: 'var(--gold)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: 6,
            fontFamily: 'var(--sans)',
          }}>
            {finalTitle}
          </span>
          <span style={{
            display: 'block',
            color: 'var(--ink)',
            fontSize: 12.5,
            lineHeight: 1.55,
            fontWeight: 400,
          }}>
            {finalBody}
          </span>
          {finalExample && (
            <span style={{
              display: 'block',
              marginTop: 8,
              paddingTop: 8,
              borderTop: '1px solid var(--line)',
              color: 'var(--ink-mute)',
              fontSize: 11.5,
              fontStyle: 'italic',
              fontFamily: 'var(--serif)',
              lineHeight: 1.5,
            }}>
              {finalExample}
            </span>
          )}
        </span>
      )}

      <style>{`
        @keyframes tooltipIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .info-tooltip-trigger:hover {
          opacity: 1 !important;
          background: rgba(201,169,110,0.14) !important;
          border-color: var(--gold) !important;
        }
      `}</style>
    </span>
  )
}
