import type { Metadata } from "next";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import { WA_ICON } from "./components/WaIcon";
import Link from "next/link";
import Reveal from "./components/Reveal";
import AnimatedCounter from "./components/AnimatedCounter";
import StockTicker from "./components/StockTicker";
import HeroOrbs from "./components/HeroOrbs";
import Typewriter from "./components/Typewriter";
import { WA_RESEARCH as RESEARCH_WA, WA_ANALYST as ANALYST_WA } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Fynoy Capital — we invest with our own money, in the open",
  description:
    "Fynoy Capital shares its full portfolio in real time: every trade, every rationale, benchmarked against VWCE. Free to follow. Not advice — you decide.",
};

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>

        {/* ── HERO ── */}
        <header className="hero">
          <div className="grid-bg" />
          <HeroOrbs />
          <div className="wrap" style={{ position: "relative", zIndex: 1 }}>
            <span className="eyebrow" style={{ animation: "fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both" }}>Transparent investment research</span>
            <h1 style={{ animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both", animationDelay: "0.1s" }}>
              We invest with<br />our <em className="it">own money.</em>
            </h1>
            <p className="hero-sub lede" style={{ animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both", animationDelay: "0.25s" }}>
              Every trade. Every rationale. Realtime. Fynoy Capital shares its full portfolio — open
              positions, closed trades and the analysis behind every decision. No blind copy trading.
              You learn how we think and decide for yourself.
            </p>
            <div style={{ marginTop: 20, animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both", animationDelay: "0.35s" }}>
              <Typewriter />
            </div>
            <div className="hero-cta" style={{ animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both", animationDelay: "0.45s" }}>
              <Link className="btn btn-primary" href="/auth/register">
                Follow the portfolio — free
              </Link>
              <Link className="btn btn-outline" href="/auth/login">
                Sign in
              </Link>
            </div>
          </div>
        </header>

        {/* ── TICKER TAPE ── */}
        <StockTicker />

        {/* ── STATS ── */}
        <div className="stats">
          <div className="stat">
            <div className="stat-num"><AnimatedCounter value={100} suffix="%" /></div>
            <div className="stat-label label">Own capital</div>
          </div>
          <div className="stat">
            <div className="stat-num"><AnimatedCounter value={12} /><em style={{ fontSize: ".7em" }}>+</em></div>
            <div className="stat-label label">Cases published</div>
          </div>
          <div className="stat">
            <div className="stat-num"><em>VWCE</em></div>
            <div className="stat-label label">Benchmark</div>
          </div>
          <div className="stat">
            <div className="stat-num"><AnimatedCounter value={2026} duration={1200} /></div>
            <div className="stat-label label">Track record from</div>
          </div>
        </div>

        {/* ── WHY ── */}
        <section className="section">
          <div className="wrap">
            <Reveal>
              <span className="eyebrow">Why Fynoy Capital</span>
              <h2 style={{ marginTop: 24, maxWidth: "20ch" }}>Three things the rest don&apos;t offer</h2>
            </Reveal>
            <div className="principles" style={{ marginTop: 48 }}>
              {[
                {
                  glyph: (
                    <svg className="glyph" viewBox="0 0 40 40" fill="none">
                      <circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="1.2" />
                      <path d="M14 20 L18 24 L26 16" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
                    </svg>
                  ),
                  title: "Skin in the game",
                  body: "We invest with our own capital. Our results are real, and so are the consequences. No theoretical picks or borrowed examples.",
                },
                {
                  glyph: (
                    <svg className="glyph" viewBox="0 0 40 40" fill="none">
                      <circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="1.2" />
                      <circle cx="20" cy="20" r="3.5" fill="currentColor" />
                      <path d="M6 20 H10 M30 20 H34 M20 6 V10 M20 30 V34" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  ),
                  title: "Full transparency",
                  body: "You see every position, every rationale, every mistake — in real time. Nothing is hidden or rewritten after the fact.",
                },
                {
                  glyph: (
                    <svg className="glyph" viewBox="0 0 40 40" fill="none">
                      <path d="M8 30 L8 12 L16 12 L16 22 L24 22 L24 8 L32 8 L32 30 Z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
                    </svg>
                  ),
                  title: "Learn to invest",
                  body: "We don&apos;t facilitate automatic copying. You see what we do and why — the decision is always yours.",
                },
              ].map((p, i) => (
                <Reveal key={p.title} delay={i * 100}>
                  <div className="principle">
                    {p.glyph}
                    <h3>{p.title}</h3>
                    <p>{p.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── TRANSPARENCY MOCK ── */}
        <section className="section">
          <div className="wrap">
            <Reveal>
              <span className="eyebrow">Live transparency</span>
            </Reveal>
            <div className="transparency-layout">
              <Reveal delay={100}>
                <div className="transparency-copy">
                  <h2>Every position.<br />Every trade.<br />Nothing hidden.</h2>
                  <p className="muted">
                    Members get a real-time view of the full Fynoy Capital portfolio — open positions
                    with live prices, every closed trade with exact P&amp;L, and performance tracked
                    against VWCE. The same data we use internally.
                  </p>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
                    <Link href="/auth/register" className="btn btn-primary">Create free account</Link>
                    <Link href="/auth/login" className="btn btn-outline">Sign in</Link>
                  </div>
                </div>
              </Reveal>
              <Reveal delay={200}>
                <div className="dashboard-mock">
                  <div className="mock-bar">
                    <span className="label">Portfolio dashboard</span>
                    <span className="mock-live">
                      <span className="mock-live-dot">●</span> Live
                    </span>
                  </div>
                  <div className="mock-metrics">
                    <div className="mock-metric">
                      <div className="label">TWR</div>
                      <div className="mock-val up">+ live</div>
                    </div>
                    <div className="mock-metric">
                      <div className="label">vs VWCE</div>
                      <div className="mock-val up">α</div>
                    </div>
                    <div className="mock-metric">
                      <div className="label">Open</div>
                      <div className="mock-val">7</div>
                    </div>
                  </div>
                  <div className="mock-section-label label">Recent open positions</div>
                  <div className="mock-table">
                    {[
                      { ticker: "MSFT", name: "Microsoft",   pnl: "thesis", up: true },
                      { ticker: "PANW", name: "Palo Alto",   pnl: "thesis", up: true },
                      { ticker: "RHM",  name: "Rheinmetall", pnl: "thesis", up: true },
                    ].map((r) => (
                      <div key={r.ticker} className="mock-row">
                        <span className="mock-ticker">{r.ticker}</span>
                        <span className="mock-name">{r.name}</span>
                        <span className={`mock-pnl ${r.up ? "up" : "dn"}`}>{r.pnl}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mock-section-label label">Closed trades</div>
                  <div className="mock-table">
                    <div className="mock-row">
                      <span className="mock-ticker">All</span>
                      <span className="mock-name">with realized P&amp;L</span>
                      <span className="mock-pnl up">in dashboard</span>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="section">
          <div className="wrap">
            <Reveal>
              <span className="eyebrow">How it works</span>
              <h2 style={{ marginTop: 24 }}>From research to realtime trade</h2>
            </Reveal>
            <div className="steps" style={{ marginTop: 48 }}>
              {[
                { n: "1", title: "Research", body: "Fundamental analysis, technical analysis and risk assessment per stock. Fully documented." },
                { n: "2", title: "Trade",    body: "Order placed with own capital. Entry, take profit and stop loss set in advance." },
                { n: "3", title: "Realtime", body: "You see the trade in the dashboard, including the rationale behind the decision." },
                { n: "4", title: "Learn",    body: "Follow the trajectory, see how we handle wins and losses, build your own view." },
              ].map((s, i) => (
                <Reveal key={s.n} delay={i * 100}>
                  <div className="step">
                    <div className="step-num">{s.n}</div>
                    <h4>{s.title}</h4>
                    <p>{s.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section className="section">
          <div className="wrap">
            <Reveal>
              <span className="eyebrow">Pricing</span>
              <h2 style={{ marginTop: 24, maxWidth: "22ch" }}>One plan. Free.</h2>
              <p className="lede" style={{ marginTop: 18, maxWidth: '54ch' }}>
                Everything we publish is free to access. Create an account and follow the portfolio.
              </p>
            </Reveal>

            <div className="pricing-single" style={{ marginTop: 48 }}>
              <Reveal>
                <div className="pricing-card pricing-card-pro">
                  <div className="pricing-head">
                    <div className="pricing-name">Free</div>
                    <div className="pricing-price"><span>€0</span> / forever</div>
                  </div>
                  <ul className="pricing-feats">
                    <li><span className="check">✓</span> Realtime portfolio dashboard</li>
                    <li><span className="check">✓</span> Open positions with live % return</li>
                    <li><span className="check">✓</span> Full trade rationale per position</li>
                    <li><span className="check">✓</span> Closed trades history with exact return</li>
                    <li><span className="check">✓</span> Performance vs VWCE benchmark</li>
                    <li><span className="check">✓</span> Sector allocation &amp; risk view</li>
                  </ul>
                  <Link className="btn btn-primary" href="/auth/register" style={{ width: '100%', justifyContent: 'center' }}>
                    Create free account
                  </Link>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── COMMUNITY CTA SPLIT ── */}
        <div className="cta-split">
          <Reveal className="cta-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <span className="eyebrow">Research community</span>
              <h2>Follow the research</h2>
              <p>Read weekly analyses, attend pitches and ask questions. Join people who treat markets as a craft.</p>
            </div>
            <div className="cta-foot">
              <a className="btn btn-primary" target="_blank" rel="noopener noreferrer" href={RESEARCH_WA}>
                {WA_ICON} Join on WhatsApp
              </a>
            </div>
          </Reveal>
          <Reveal delay={100} className="cta-card gold" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <span className="eyebrow">Become an analyst</span>
              <h2>Write your own research</h2>
              <p>Write research reports, present stock pitches and build experience inside a real investment team.</p>
            </div>
            <div className="cta-foot">
              <a className="btn btn-on-gold" target="_blank" rel="noopener noreferrer" href={ANALYST_WA}>
                {WA_ICON} Apply via WhatsApp
              </a>
            </div>
          </Reveal>
        </div>

        {/* ── DISCLAIMER ── */}
        <section className="section" style={{ paddingTop: 32 }}>
          <div className="wrap">
            <p className="muted" style={{ fontSize: 12, maxWidth: '72ch', lineHeight: 1.7 }}>
              Fynoy Capital shares information and analysis purely for education and transparency. We do
              not facilitate automated trading. Users always place their own orders. This is not investment
              advice. Past performance does not guarantee future results.
            </p>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
