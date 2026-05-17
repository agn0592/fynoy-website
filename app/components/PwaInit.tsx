'use client'

import { useEffect } from 'react'

export default function PwaInit() {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {})
    }

    // Intercept beforeinstallprompt as early as possible so InstallPrompt
    // can read it from window.__pwaDeferred even if it fired before mounting
    const handler = (e: Event) => {
      e.preventDefault()
      ;(window as Window & { __pwaDeferred?: unknown }).__pwaDeferred = e
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  return null
}
