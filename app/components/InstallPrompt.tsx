'use client'

import { useEffect, useState } from 'react'

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

const IOS_SHARE = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline',verticalAlign:'middle',flexShrink:0}}>
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
    <polyline points="16 6 12 2 8 6"/>
    <line x1="12" y1="2" x2="12" y2="15"/>
  </svg>
)

interface DeferredPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type Mode = 'native' | 'ios' | 'android'

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<DeferredPromptEvent | null>(null)
  const [mode, setMode] = useState<Mode | null>(null)
  const [visible, setVisible] = useState(false)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if (localStorage.getItem('pwa-dismissed') === '1') return

    // iPadOS 13+ reports as MacIntel but has touch points
    const ios =
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

    if (ios) {
      setMode('ios')
      const t = setTimeout(() => setVisible(true), 2000)
      return () => clearTimeout(t)
    }

    let promptReceived = false

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferred(e as DeferredPromptEvent)
      setMode('native')
      if (!promptReceived) {
        promptReceived = true
        setTimeout(() => setVisible(true), 1500)
      }
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Fallback: Android Chrome may not fire beforeinstallprompt on first visit
    const fallback = setTimeout(() => {
      if (!promptReceived) {
        setMode('android')
        setVisible(true)
      }
    }, 7000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      clearTimeout(fallback)
    }
  }, [])

  function dismiss() {
    setVisible(false)
    localStorage.setItem('pwa-dismissed', '1')
  }

  async function install() {
    if (!deferred) return
    setInstalling(true)
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    setInstalling(false)
    if (outcome === 'accepted') setVisible(false)
  }

  if (!mode || !visible) return null

  return (
    <div className="pwa-banner" role="region" aria-label="App installeren">
      <div className="pwa-banner-inner">
        <div className="pwa-banner-left">
          <span className="pwa-banner-icon">{LOGO}</span>
          <div className="pwa-banner-text">
            <span className="pwa-banner-title">Installeer Fynoy Capital</span>
            {mode === 'ios' && (
              <span className="pwa-banner-sub">
                Tik op {IOS_SHARE} hieronder, dan <em>Zet op beginscherm</em>
              </span>
            )}
            {mode === 'android' && (
              <span className="pwa-banner-sub">
                Tik op <em>⋮</em> in je browser → <em>App installeren</em>
              </span>
            )}
            {mode === 'native' && (
              <span className="pwa-banner-sub">
                Direct toegang tot je portfolio, zonder browser
              </span>
            )}
          </div>
        </div>
        <div className="pwa-banner-actions">
          {mode === 'native' && (
            <button className="pwa-install-btn" onClick={install} disabled={installing}>
              {installing ? 'Installeren…' : 'Installeer'}
            </button>
          )}
          <button className="pwa-dismiss-btn" onClick={dismiss} aria-label="Sluiten">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
