'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

const TAB_TO_ANCHOR: Record<string, string> = {
  privacy: 'privacy',
  terms: 'terms',
  cookies: 'cookies',
  disclaimer: 'disclaimer',
}

export default function LegalContent() {
  const searchParams = useSearchParams()

  // Support ?tab=privacy from old footer links AND #anchor from new links
  useEffect(() => {
    const tab = searchParams.get('tab')
    const target = tab ? TAB_TO_ANCHOR[tab] : null
    const id = target ?? (typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : '')
    if (!id) return
    const el = document.getElementById(id)
    if (el) {
      // Wait a tick so layout settles
      requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    }
  }, [searchParams])

  return (
    <section className="section">
      <div className="wrap legal-wrap">

        <div className="legal-block" id="privacy">
          <h2>Privacy Policy</h2>
          <p className="muted">Last updated: May 2026</p>
          <p>
            Fynoy Capital (KvK 86136062, Rotterdam, Netherlands) operates fynoy.com. This policy explains
            what personal data we collect, why, and how we handle it.
          </p>
          <h3>Data we collect</h3>
          <p>
            We collect only the data you voluntarily provide — for example, your name and email when you
            create an account, or when you reach out via WhatsApp or email. We do not run advertising
            networks or sell personal data to third parties.
          </p>
          <h3>How we use it</h3>
          <p>
            Data you share is used to operate the portfolio dashboard, send transactional emails such as
            account confirmation and password reset, respond to your enquiries, and improve the service.
            We retain data only as long as necessary.
          </p>
          <h3>Your rights (GDPR)</h3>
          <p>
            As a resident of the EU/EEA you have the right to access, correct, or delete your personal
            data. To exercise any of these rights, contact us at{" "}
            <a href="mailto:info@fynoy.com">info@fynoy.com</a>.
          </p>
          <h3>Cookies</h3>
          <p>
            This website uses no tracking or advertising cookies. See the Cookie Policy below for details.
          </p>
        </div>

        <div className="legal-block" id="terms">
          <h2>Terms &amp; Conditions</h2>
          <p className="muted">Last updated: May 2026</p>
          <p>
            By accessing fynoy.com you agree to these terms. Fynoy Capital reserves the right to update
            them at any time; continued use of the site constitutes acceptance.
          </p>
          <h3>Information only</h3>
          <p>
            All content on this site — including stock research, case summaries, and performance figures —
            is provided for informational purposes only. Nothing on fynoy.com constitutes investment advice,
            a solicitation, or an offer to buy or sell any security.
          </p>
          <h3>No regulated activity</h3>
          <p>
            Fynoy Capital is not licensed by the AFM (Autoriteit Financiële Markten) or any other financial
            regulator. The research community is a private, non-commercial activity. We do not manage
            third-party capital.
          </p>
          <h3>Intellectual property</h3>
          <p>
            All content, design, and research published by Fynoy Capital is proprietary. You may not
            reproduce, redistribute, or commercially exploit any material without prior written consent.
          </p>
          <h3>Limitation of liability</h3>
          <p>
            To the fullest extent permitted by law, Fynoy Capital accepts no liability for losses arising
            from reliance on any information published on this site or shared within the research community.
          </p>
        </div>

        <div className="legal-block" id="cookies">
          <h2>Cookie Policy</h2>
          <p className="muted">Last updated: May 2026</p>
          <p>
            fynoy.com uses no advertising or analytics cookies. The only cookies that may be set are
            strictly necessary technical cookies required for the site to function (e.g., authentication
            session tokens). No cookie consent banner is shown because no non-essential cookies are placed.
          </p>
          <p>
            Third-party services linked from this site (such as WhatsApp) operate under their own cookie
            and privacy policies.
          </p>
        </div>

        <div className="legal-block" id="disclaimer">
          <h2>Disclaimer</h2>
          <p className="muted">Last updated: May 2026</p>
          <p>
            <strong>Past performance does not guarantee future results.</strong> All portfolio returns
            quoted on this site are unaudited and for informational purposes only. Investing in public
            equities involves risk, including the risk of losing some or all of your capital.
          </p>
          <p>
            The views expressed by Fynoy Capital represent the personal opinions of its team and should
            not be construed as professional investment advice. You should conduct your own research and,
            if appropriate, seek advice from a licensed financial adviser before making any investment
            decision.
          </p>
          <p>
            Fynoy Capital holds positions in securities discussed on this site — that is the entire point
            of publishing them. Users always place their own orders. We do not facilitate automated
            trading.
          </p>
          <p style={{ marginTop: 32 }}>
            Questions? Contact us at <a href="mailto:info@fynoy.com">info@fynoy.com</a>.
          </p>
        </div>

      </div>
    </section>
  )
}
