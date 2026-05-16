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

export const metadata: Metadata = {
  title: "Fynoy Capital — Independent equity research & investment",
  description:
    "Fynoy Capital is an independent, research-led investment practice based in Rotterdam. Weekly stock pitches, a serious investor community, and long-only conviction.",
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
            <span className="eyebrow" style={{ animation: "fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both" }}>Independent equity research &amp; investment</span>
            <h1 style={{ animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both", animationDelay: "0.1s" }}>
              Conviction-driven<br />investing,<br />built in the <em className="it">open.</em>
            </h1>
            <p className="hero-sub lede" style={{ animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both", animationDelay: "0.25s" }}>
              Weekly stock research, live pitch sessions, and a community of serious investors —
              a transparent, research-led practice in long-only public equities.
            </p>
            <div style={{ marginTop: 20, animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both", animationDelay: "0.35s" }}>
              <Typewriter />
            </div>
            <div className="hero-cta" style={{ animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both", animationDelay: "0.45s" }}>
              <a
                className="btn btn-primary"
                href="https://wa.me/31682074482?text=Hi%2C%20I'd%20like%20to%20join%20the%20Fynoy%20Capital%20research%20group."
                target="_blank"
                rel="noopener noreferrer"
              >
                {WA_ICON} Join Us
              </a>
              <Link className="btn btn-outline" href="/work-with-us">Work With Us</Link>
            </div>
          </div>
        </header>

        {/* ── TICKER TAPE ── */}
        <StockTicker />

        {/* ── STATS ── */}
        <div className="stats">
          <div className="stat">
            <div className="stat-num"><AnimatedCounter value={52} /></div>
            <div className="stat-label label">Pitches per year</div>
          </div>
          <div className="stat">
            <div className="stat-num"><em><AnimatedCounter value={68} suffix="%" /></em></div>
            <div className="stat-label label">Win rate</div>
          </div>
          <div className="stat">
            <div className="stat-num"><AnimatedCounter value={150} /><em style={{ fontSize: ".7em" }}>+</em></div>
            <div className="stat-label label">Stocks researched</div>
          </div>
          <div className="stat">
            <div className="stat-num"><AnimatedCounter value={2025} duration={1200} /></div>
            <div className="stat-label label">Founded</div>
          </div>
        </div>

        {/* ── ABOUT STRIP ── */}
        <section className="section">
          <div className="wrap two-col">
            <Reveal>
              <span className="eyebrow">About</span>
              <h2 style={{ marginTop: 24 }}>A research-led approach to long-only equity investing</h2>
            </Reveal>
            <Reveal delay={120}>
              <p>
                Fynoy Capital was founded with a single conviction: that rigorous, independent research is the
                only sustainable edge in public markets. What started as a personal investment practice has grown
                into a structured weekly process — researching, pitching, and investing in individual equities
                every Thursday.
              </p>
              <p>
                We do not chase trends, run momentum books, or dilute decisions across hundreds of names. Each
                position is the outcome of a written thesis, defended live before it ever reaches the portfolio.
                Discipline, transparency, and long-only conviction define how we operate.
              </p>
              <Link className="btn btn-ghost" href="/about" style={{ marginTop: 8 }}>
                <span>About Fynoy Capital</span><span style={{ color: "var(--gold)" }}>→</span>
              </Link>
            </Reveal>
          </div>
        </section>

        {/* ── PERFORMANCE ── */}
        <section className="section">
          <div className="wrap">
            <Reveal>
              <span className="eyebrow">Performance</span>
              <h2 style={{ marginTop: 24, maxWidth: "18ch" }}>Portfolio at a glance</h2>
            </Reveal>
            <div className="metric-grid" style={{ marginTop: 48 }}>
              <Reveal delay={0}>
                <div className="metric">
                  <div className="label">Total return YTD</div>
                  <div className="metric-num up">+<AnimatedCounter value={21} suffix="%" /></div>
                  <p className="metric-cap">Fynoy Capital portfolio, year-to-date through latest close.</p>
                </div>
              </Reveal>
              <Reveal delay={100}>
                <div className="metric">
                  <div className="label">vs FTSE All-World</div>
                  <div className="metric-num up">+<AnimatedCounter value={17} suffix="%" /></div>
                  <p className="metric-cap">Outperformance against the FTSE All-World index.</p>
                </div>
              </Reveal>
              <Reveal delay={200}>
                <div className="metric">
                  <div className="label">FTSE All-World YTD</div>
                  <div className="metric-num up">+<AnimatedCounter value={4} suffix="%" /></div>
                  <p className="metric-cap">Benchmark return, year-to-date through latest close.</p>
                </div>
              </Reveal>
            </div>
            <p className="muted" style={{ marginTop: 24, fontSize: 12, maxWidth: "64ch" }}>
              Returns are unaudited and for informational purposes only. Past performance does not guarantee future results.
            </p>
          </div>
        </section>

        {/* ── TRANSPARENCY ── */}
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
                    Members get a real-time view of the full Fynoy Capital portfolio — open positions with live prices, every closed trade with exact P&amp;L, and weekly performance tracked against the FTSE All-World. The same data we use internally.
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
                      <div className="label">YTD Return</div>
                      <div className="mock-val up">+21.0%</div>
                    </div>
                    <div className="mock-metric">
                      <div className="label">vs Benchmark</div>
                      <div className="mock-val up">+17.4pp</div>
                    </div>
                    <div className="mock-metric">
                      <div className="label">Win rate</div>
                      <div className="mock-val">68%</div>
                    </div>
                  </div>
                  <div className="mock-section-label label">Open positions</div>
                  <div className="mock-table">
                    {[
                      { ticker: "NVDA", name: "Nvidia Corp.", pnl: "+34.2%", up: true },
                      { ticker: "ASML", name: "ASML Holding", pnl: "+12.8%", up: true },
                      { ticker: "AAPL", name: "Apple Inc.",   pnl: "+8.1%",  up: true },
                    ].map((r) => (
                      <div key={r.ticker} className="mock-row">
                        <span className="mock-ticker">{r.ticker}</span>
                        <span className="mock-name">{r.name}</span>
                        <span className={`mock-pnl ${r.up ? "up" : "dn"}`}>{r.pnl}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mock-section-label label">Recent closed trade</div>
                  <div className="mock-table">
                    <div className="mock-row">
                      <span className="mock-ticker">META</span>
                      <span className="mock-name">Meta Platforms</span>
                      <span className="mock-pnl up">+61.4%</span>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── APPROACH ── */}
        <section className="section">
          <div className="wrap">
            <Reveal>
              <span className="eyebrow">Our approach</span>
              <h2 style={{ marginTop: 24 }}>How Fynoy Capital invests</h2>
            </Reveal>
            <div className="approach-grid" style={{ marginTop: 48 }}>
              {[
                { num: "— 01", title: "Bottom-up equity research", body: "Every position begins with a written thesis: business model, competitive position, unit economics, valuation. No top-down trades." },
                { num: "— 02", title: "Weekly pitch sessions", body: "Every Thursday, one stock is pitched live to the group. The thesis is challenged, refined or rejected before any capital moves." },
                { num: "— 03", title: "Concentrated portfolio", body: "Conviction over diversification. We hold a small number of names where the work is deepest and the asymmetry is clearest." },
                { num: "— 04", title: "Independent & transparent", body: "No external mandates, no benchmarks dictating positions. Reports are shared openly with the research group ahead of every pitch." },
              ].map((item, i) => (
                <Reveal key={i} delay={i * 80}>
                  <div className="approach">
                    <div className="approach-num">{item.num}</div>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="section">
          <div className="wrap">
            <Reveal>
              <span className="eyebrow">Process</span>
              <h2 style={{ marginTop: 24 }}>How it works</h2>
            </Reveal>
            <div className="steps" style={{ marginTop: 48 }}>
              {[
                { n: "1", title: "Stock selected", body: "A single name is chosen for the week, based on screening, news flow, or analyst conviction." },
                { n: "2", title: "Report published", body: "A full written thesis is distributed to the research group ahead of the pitch session." },
                { n: "3", title: "Live pitch", body: "Every Thursday the analyst defends the thesis live. Members ask, push back, and refine." },
                { n: "4", title: "Decision made", body: "Buy, watch, or pass. If we buy, the position is sized and entered transparently." },
              ].map((s, i) => (
                <Reveal key={i} delay={i * 100}>
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

        {/* ── CTA SPLIT ── */}
        <div className="cta-split">
          <Reveal className="cta-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <span className="eyebrow">Research group</span>
              <h2>Join Us</h2>
              <p>Follow the weekly research, attend Thursday pitches, and join a serious investor community. Free to join, no commitments.</p>
            </div>
            <div className="cta-foot">
              <a className="btn btn-primary" target="_blank" rel="noopener noreferrer"
                href="https://wa.me/31682074482?text=Hi%2C%20I'd%20like%20to%20join%20the%20Fynoy%20Capital%20research%20group.">
                {WA_ICON} Join on WhatsApp
              </a>
            </div>
          </Reveal>
          <Reveal delay={100} className="cta-card gold" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <span className="eyebrow">Collaboration</span>
              <h2>Work With Us</h2>
              <p>Experienced traders collaborate with Fynoy Capital on a profit-sharing basis. We provide the research and capital. You provide the execution.</p>
            </div>
            <div className="cta-foot">
              <a className="btn btn-on-gold" target="_blank" rel="noopener noreferrer"
                href="https://wa.me/31682074482?text=Hi%2C%20I'm%20interested%20in%20collaborating%20as%20a%20trader%20with%20Fynoy%20Capital.">
                {WA_ICON} Get in touch
              </a>
            </div>
          </Reveal>
        </div>

      </main>
      <Footer />
    </>
  );
}
