'use client'

import { useEffect } from 'react'

const LOGO_SVG = `<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" width="26" height="26">
  <rect x="6" y="32" width="6" height="20" fill="#c9a96e" opacity=".55"/>
  <rect x="16" y="24" width="6" height="28" fill="#c9a96e" opacity=".7"/>
  <rect x="26" y="14" width="6" height="38" fill="#c9a96e" opacity=".85"/>
  <rect x="36" y="6" width="6" height="46" fill="#c9a96e"/>
  <path d="M8 40 L42 12" stroke="#c9a96e" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M37 8 L42 12 L40 18" stroke="#c9a96e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`

const SHARE_SVG = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c9a96e" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle">
  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
  <polyline points="16 6 12 2 8 6"/>
  <line x1="12" y1="2" x2="12" y2="15"/>
</svg>`

const CLOSE_SVG = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
  <path d="M1 1l12 12M13 1L1 13" stroke="#5d5d57" stroke-width="1.5" stroke-linecap="round"/>
</svg>`

export default function InstallPrompt() {
  useEffect(() => {
    // Already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if ((navigator as unknown as { standalone?: boolean }).standalone === true) return

    // Already dismissed
    try { if (localStorage.getItem('pwa-v2-dismissed') === '1') return } catch { /* private mode */ }

    const ios =
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

    // ── Build banner via DOM ──────────────────────────────────────────────────
    const el = document.createElement('div')
    el.id = 'pwa-banner'

    const isMobile = window.innerWidth <= 480
    el.style.cssText = [
      'position:fixed',
      isMobile
        ? `bottom:calc(64px + env(safe-area-inset-bottom,0px));left:12px;right:12px`
        : `bottom:24px;left:50%;transform:translateX(-50%);width:min(480px,calc(100vw - 32px))`,
      'background:#0d1424',
      'border:1px solid rgba(201,169,110,0.35)',
      'border-radius:6px',
      'box-shadow:0 8px 40px rgba(0,0,0,0.55)',
      'z-index:9999',
      'font-family:"DM Sans",system-ui,sans-serif',
      'font-size:13px',
      'color:#e8e4dc',
      'opacity:0',
      'transition:opacity 0.3s ease,transform 0.3s ease',
      isMobile ? 'transform:translateY(12px)' : 'transform:translateX(-50%) translateY(12px)',
    ].join(';')

    const iosContent = `
      <div style="display:flex;flex-direction:column;gap:4px;min-width:0">
        <div style="font-family:'Playfair Display',Georgia,serif;font-size:14px;font-weight:500;color:#e8e4dc;letter-spacing:-0.01em">Install Fynoy Capital</div>
        <div style="display:flex;flex-direction:column;gap:3px">
          <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#5d5d57">
            <span style="width:15px;height:15px;border-radius:50%;background:rgba(201,169,110,0.15);border:1px solid rgba(201,169,110,0.35);color:#c9a96e;font-size:8px;font-weight:600;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">1</span>
            Tap the share icon ${SHARE_SVG} in Safari
          </div>
          <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#5d5d57">
            <span style="width:15px;height:15px;border-radius:50%;background:rgba(201,169,110,0.15);border:1px solid rgba(201,169,110,0.35);color:#c9a96e;font-size:8px;font-weight:600;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">2</span>
            Tap <span style="color:#c9a96e">Add to Home Screen</span>
          </div>
        </div>
      </div>`

    const desktopContent = `
      <div style="display:flex;flex-direction:column;gap:3px;min-width:0">
        <div style="font-family:'Playfair Display',Georgia,serif;font-size:14px;font-weight:500;color:#e8e4dc;letter-spacing:-0.01em">Install Fynoy Capital</div>
        <div style="font-size:11px;color:#5d5d57">Instant access to our portfolio — no browser needed</div>
      </div>`

    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;padding:14px 16px">
        <span style="flex-shrink:0;width:34px;height:34px;background:rgba(201,169,110,0.08);border:1px solid rgba(201,169,110,0.35);border-radius:8px;display:flex;align-items:center;justify-content:center">${LOGO_SVG}</span>
        <div style="flex:1;min-width:0">${ios ? iosContent : desktopContent}</div>
        <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
          ${!ios ? `<button id="pwa-install-btn" style="padding:7px 14px;background:#c9a96e;color:#1a140a;font-family:inherit;font-size:12px;font-weight:600;letter-spacing:0.04em;border:none;border-radius:2px;cursor:pointer;white-space:nowrap">Install app</button>` : ''}
          <button id="pwa-dismiss-btn" style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;border:none;background:none;cursor:pointer;border-radius:2px;flex-shrink:0">${CLOSE_SVG}</button>
        </div>
      </div>`

    document.body.appendChild(el)

    // ── Show ─────────────────────────────────────────────────────────────────
    const showBanner = () => {
      el.style.opacity = '1'
      el.style.transform = isMobile ? 'translateY(0)' : 'translateX(-50%) translateY(0)'
    }

    const hideBanner = () => {
      el.style.opacity = '0'
      el.style.transform = isMobile ? 'translateY(12px)' : 'translateX(-50%) translateY(12px)'
      setTimeout(() => el.remove(), 350)
    }

    const t = setTimeout(showBanner, 1500)

    // ── Dismiss ───────────────────────────────────────────────────────────────
    document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
      hideBanner()
      try { localStorage.setItem('pwa-v2-dismissed', '1') } catch { /* ignore */ }
    })

    // ── Install button (Chrome/Edge/Android) ──────────────────────────────────
    let deferred = (window as unknown as Record<string, unknown>).__pwaDeferred as
      | (Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> })
      | undefined

    const capturePrompt = (e: Event) => {
      e.preventDefault()
      deferred = e as typeof deferred
    }
    window.addEventListener('beforeinstallprompt', capturePrompt)

    document.getElementById('pwa-install-btn')?.addEventListener('click', async () => {
      if (!deferred) return
      const btn = document.getElementById('pwa-install-btn') as HTMLButtonElement
      if (btn) btn.textContent = 'Installing…'
      await deferred.prompt()
      const { outcome } = await deferred.userChoice
      if (outcome === 'accepted') hideBanner()
      else if (btn) btn.textContent = 'Install app'
    })

    return () => {
      clearTimeout(t)
      window.removeEventListener('beforeinstallprompt', capturePrompt)
      document.getElementById('pwa-banner')?.remove()
    }
  }, [])

  return null
}
