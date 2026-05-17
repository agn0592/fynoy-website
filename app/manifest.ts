import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Fynoy Capital',
    short_name: 'Fynoy',
    description: 'Transparent portfolio dashboard — Fynoy Capital invests with its own money and shares every trade in real time.',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    background_color: '#0a0f1e',
    theme_color: '#0a0f1e',
    orientation: 'portrait-primary',
    categories: ['finance', 'business'],
    icons: [
      {
        src: '/fynoy-square.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/fynoy-square.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
