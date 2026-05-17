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
  // Start hidden — always in DOM so iOS Safari never misses it
  const [show, setShow] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [installing, setInstalling] = useState(false)
  const deferredRef = useRef<DeferredPromptEvent | null>(null)

  useEffect(() => {
    // Don't show if already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return
    // iOS-specific standalone check
    if ((navigator as unknown as Record<string, unknown>).standalone === true) return

    try {
      if (localStorage.getItem('pwa-v2-dismissed') === '1') return
    } catch { /* private browsing */ }

    const ios =
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    setIsIos(ios)

    // Pick up deferred prompt if already captured by PwaInit
    const w = window as AnyWindow
    if (w.__pwaDeferred) deferredRef.current = w.__pwaDeferred as DeferredPromptEvent

    const handler = (e: Event) => {
      e.preventDefault()
      deferredRef.current = e as DeferredPromptEvent
      ;(window as AnyWindow).__pwaDeferred = e
    }
    window.addEventListener('beforeinstallprompt', handler)

    // Show after 1.5 s — element is already in DOM so this just triggers transition
    const t = setTimeout(() => setShow(true), 1500)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      clearTimeout(t)
    }
  }, [])

  function dismiss() {
    setShow(false)
    try { localStorage.setItem('pwa-v2-dismissed', '1') } catch { /* ignore */ }
  }

  async function install() {
    const d = deferredRef.current
    if (!d) return
    setInstalling(true)
    await d.prompt()
    const { outcome } = await d.userChoice
    setInstalling(false)
    if (outcome === 'accepted') setShow(false)
  }

  // Always render — visibility controlled by CSS class, not conditional render.
  // This is crucial for iOS Safari where removing from DOM can miss the transition.
  return (
    <div
      className={`pwa-banner${show ? ' pwa-banner--show' : ''}`}
      role="region"
      aria-label="Install app"
      aria-hidden={!show}
    >
      <div className="pwa-banner-inner">
        <div className="pwa-banner-left">
          <span className="pwa-banner-icon">{LOGO}</span>
          <div className="pwa-banner-text">
            <span className="pwa-banner-title">Install Fynoy Capital</span>
            {isIos ? (
              <span className="pwa-banner-sub pwa-banner-sub--ios">
                <span className="pwa-ios-step">
                  <span className="pwa-ios-num">1</span>
                  Tap the share icon
                  <span className="pwa-ios-share-icon" aria-hidden="true">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                      <polyline points="16 6 12 2 8 6"/>
                      <line x1="12" y1="2" x2="12" y2="15"/>
                    </svg>
                  </span>
                  in Safari
                </span>
                <span className="pwa-ios-step">
                  <span className="pwa-ios-num">2</span>
                  Tap <em>Add to Home Screen</em>
                </span>
              </span>
            ) : (
              <span className="pwa-banner-sub">
                Instant access to our portfolio — no browser needed
              </span>
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
