'use client'

import { useEffect, useState } from 'react'

const PHRASES = [
  'Eigen geld. Geen advies.',
  'Elke trade openbaar.',
  'Volledige redenering per positie.',
  'Performance vs VWCE.',
  'Transparant. Realtime.',
]

export default function Typewriter() {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const phrase = PHRASES[phraseIndex]
    let timeout: ReturnType<typeof setTimeout>

    if (!deleting && displayed.length < phrase.length) {
      timeout = setTimeout(() => setDisplayed(phrase.slice(0, displayed.length + 1)), 60)
    } else if (!deleting && displayed.length === phrase.length) {
      timeout = setTimeout(() => setDeleting(true), 1800)
    } else if (deleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 35)
    } else if (deleting && displayed.length === 0) {
      setDeleting(false)
      setPhraseIndex((i) => (i + 1) % PHRASES.length)
    }

    return () => clearTimeout(timeout)
  }, [displayed, deleting, phraseIndex])

  return (
    <span className="typewriter">
      {displayed}
      <span className="typewriter-cursor" />
    </span>
  )
}
