/**
 * Contact and routing constants used throughout the public site and dashboard.
 * Centralized here so phone / email / domain changes happen in one place.
 */

export const CONTACT_EMAIL = 'info@fynoy.com'
export const CONTACT_PHONE_E164 = '31682074482'
export const CONTACT_PHONE_DISPLAY = '+31 6 82074482'

const WA_BASE = `https://wa.me/${CONTACT_PHONE_E164}`

export const WA_RESEARCH = `${WA_BASE}?text=${encodeURIComponent(
  "Hi, I'd like to join the Fynoy Capital research group."
)}`
export const WA_ANALYST = `${WA_BASE}?text=${encodeURIComponent(
  "Hi, I'm interested in collaborating as a trader with Fynoy Capital."
)}`
export const WA_GENERAL = `${WA_BASE}?text=${encodeURIComponent(
  'Hi, I have a question about Fynoy Capital.'
)}`

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'https://fynoy.com'
