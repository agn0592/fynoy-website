'use client'

import { useEffect, useRef, useState } from 'react'

const LOGO = (
  <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
    <rect x="6"  y="32" width="6" height="20" fill="#c9a96e" opacity=".55"/>
    <rect x="16" y="24" width="6" height="28" fill="#c9a96e" opacity=".7"/>
    <rect x="26" y="14" width="6" height="38" fill="#c9a96e" opacity=".85"/>
    <rect x="36" y="6"  width="6" height="46" fill="#c9a96e"/>
    <path d="M8 40 L42 12" stroke="#c9a96e" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M37 8 L42 12 L40 18" stroke="#c9a96e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
)

interface DeferredPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type AnyWindow = Window & { __pwaDeferred?: unknown }

export default function InstallPrompt() {
  const [visible, setVisible] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [installing, setInstalling] = useState(false)
  const deferredRef = useRef<DeferredPromptEvent | null>(null)

  useEffect(() => {
    // Already running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return
    // Previously dismissed (new key — clears old dismissals)
    if (localStorage.getItem('pwa-v2-dismissed') === '1') return

    // iPadOS 13+ reports as MacIntel but has touch points
    const ios =
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    setIsIos(ios)

    // Grab deferred prompt captured early by PwaInit (may already be set)
    const w = window as AnyWindow
    if (w.__pwaDeferred) {
      deferredRef.current = w.__pwaDeferred as DeferredPromptEvent
    }

    // Also listen in case it fires after we mount
    const handler = (e: Event) => {
      e.preventDefault()
      deferredRef.current = e as DeferredPromptEvent
      ;(window as AnyWindow).__pwaDeferred = e
    }
    window.addEventListener('beforeinstallprompt', handler)

    // Show banner after 2.5 s — works for iOS, Android, and desktop
    const t = setTimeout(() => setVisible(true), 2500)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      clearTimeout(t)
    }
  }, [])

  function dismiss() {
    setVisible(false)
    localStorage.setItem('pwa-v2-dismissed', '1')
  }

  async function install() {
    const d = deferredRef.current
    if (!d) {
      // Native prompt not yet available — open browser install menu as fallback
      // (works in Chrome via keyboard shortcut / address bar install icon)
      return
    }
    setInstalling(true)
    await d.prompt()
    const { outcome } = await d.userChoice
    setInstalling(false)
    if (outcome === 'accepted') setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="pwa-banner" role="region" aria-label="Install app">
      <div className="pwa-banner-inner">
        <div className="pwa-banner-left">
          <span className="pwa-banner-icon">{LOGO}</span>
          <div className="pwa-banner-text">
            <span className="pwa-banner-title">Install Fynoy Capital</span>
            {isIos ? (
              <span className="pwa-banner-sub">
                Tap{' '}
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <polyline points="16 6 12 2 8 6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
                {' '}then <em>Add to Home Screen</em>
              </span>
            ) : (
              <span className="pwa-banner-sub">Instant access to your portfolio — no browser needed</span>
            )}
          </div>
        </div>
        <div className="pwa-banner-actions">
          {!isIos && (
            <button className="pwa-install-btn" onClick={install} disabled={installing}>
              {installing ? 'Installing…' : 'Install app'}
            </button>
          )}
          <button className="pwa-dismiss-btn" onClick={dismiss} aria-label="Dismiss">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
