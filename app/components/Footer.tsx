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
            <p className="foot-blurb">Independent equity research and investment, based in Rotterdam.</p>
          </div>
          <div>
            <h5>Navigation</h5>
            <Link href="/">Home</Link>
            <Link href="/about">About</Link>
            <Link href="/join">Join Us</Link>
            <Link href="/work-with-us">Work With Us</Link>
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
            <a href="mailto:fynoycapital@gmail.com">fynoycapital@gmail.com</a>
            <a href="https://wa.me/31682074482" target="_blank" rel="noopener noreferrer">+31 6 82074482</a>
            <Link href="/contact">Rotterdam, Netherlands</Link>
            <span style={{ display: "block", padding: "6px 0", fontSize: 14, color: "var(--ink-mute)" }}>KvK 86136062</span>
          </div>
        </div>
        <div className="foot-bot">
          <div>© 2026 Fynoy Capital. All rights reserved.</div>
          <div className="disc">
            Fynoy Capital is not licensed by the Autoriteit Financiële Markten (AFM). Nothing on this site
            constitutes investment advice. Past performance does not guarantee future results.
          </div>
        </div>
      </div>
    </footer>
  );
}
