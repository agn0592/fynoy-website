import Link from "next/link";

const LOGO_SVG = (
  <svg viewBox="0 0 60 60" fill="none">
    <rect x="6"  y="32" width="6" height="20" fill="#c9a96e" opacity=".55"/>
    <rect x="16" y="24" width="6" height="28" fill="#c9a96e" opacity=".7"/>
    <rect x="26" y="14" width="6" height="38" fill="#c9a96e" opacity=".85"/>
    <rect x="36" y="6"  width="6" height="46" fill="#c9a96e"/>
    <path d="M8 40 L42 12" stroke="#c9a96e" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M37 8 L42 12 L40 18" stroke="#c9a96e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
);

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const LinkedInIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <Link href="/" className="brand" style={{ fontSize: 18 }}>
              <span className="brand-mark" aria-hidden="true" style={{ width: 24, height: 24 }}>{LOGO_SVG}</span>
              <span className="brand-name"><b>Fynoy</b><i>Capital</i></span>
            </Link>
            <p className="foot-blurb">Transparant investment research — wij beleggen met eigen geld en delen elke trade realtime. Gevestigd in Rotterdam.</p>
            <div className="social-links" style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
              <a href="https://x.com/fynoycapital" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" style={{ color: 'var(--ink)', transition: 'color 0.2s', opacity: 0.8 }}>
                <XIcon style={{ width: 20, height: 20 }} />
              </a>
              <a href="https://www.instagram.com/fynoycapital/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" style={{ color: 'var(--ink)', transition: 'color 0.2s', opacity: 0.8 }}>
                <InstagramIcon style={{ width: 20, height: 20 }} />
              </a>
              <a href="https://www.facebook.com/fynoycapital" target="_blank" rel="noopener noreferrer" aria-label="Facebook" style={{ color: 'var(--ink)', transition: 'color 0.2s', opacity: 0.8 }}>
                <FacebookIcon style={{ width: 20, height: 20 }} />
              </a>
              <a href="https://www.linkedin.com/company/fynoy-capital/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" style={{ color: 'var(--ink)', transition: 'color 0.2s', opacity: 0.8 }}>
                <LinkedInIcon style={{ width: 20, height: 20 }} />
              </a>
            </div>
          </div>
          <div>
            <h5>Navigation</h5>
            <Link href="/">Home</Link>
            <Link href="/about">About</Link>
            <Link href="/join">Join Us</Link>
            <Link href="/work-with-us">Work With Us</Link>
            <Link href="/download-app">Installeer als app</Link>
            <Link href="/contact">Contact</Link>
          </div>
          <div>
            <h5>Legal</h5>
            <Link href="/legal?tab=privacy">Privacy Policy</Link>
            <Link href="/legal?tab=terms">Terms &amp; Conditions</Link>
            <Link href="/legal?tab=cookies">Cookie Policy</Link>
            <Link href="/legal?tab=disclaimer">Disclaimer</Link>
          </div>
          <div>
            <h5>Contact</h5>
            <a href="mailto:info@fynoy.com">info@fynoy.com</a>
            <a href="https://wa.me/31682074482" target="_blank" rel="noopener noreferrer">+31 6 82074482</a>
            <Link href="/contact">Rotterdam, Netherlands</Link>
            <span style={{ display: "block", padding: "6px 0", fontSize: 14, color: "var(--ink-mute)" }}>KvK 86136062</span>
          </div>
        </div>
        <div className="foot-bot">
          <div>© 2026 Fynoy Capital. All rights reserved.</div>
          <div className="disc">
            Fynoy Capital deelt informatie en analyses uitsluitend ter educatie en transparantie. Wij faciliteren
            geen automatisch handelen. Gebruikers plaatsen altijd zelf hun orders. Dit is geen beleggingsadvies.
            Rendementen uit het verleden bieden geen garantie voor de toekomst.
          </div>
        </div>
      </div>
    </footer>
  );
}
