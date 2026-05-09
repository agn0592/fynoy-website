import type { Metadata } from "next";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import { WA_ICON } from "./components/WaIcon";
import Link from "next/link";

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
          <div className="wrap" style={{ position: "relative" }}>
            <span className="eyebrow">Independent equity research &amp; investment</span>
            <h1>Conviction-driven<br />investing,<br />built in the <em className="it">open.</em></h1>
            <p className="hero-sub lede">
              Weekly stock research, live pitch sessions, and a community of serious investors —
              a transparent, research-led practice in long-only public equities.
            </p>
            <div className="hero-cta">
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

        {/* ── STATS ── */}
        <div className="stats">
          <div className="stat">
            <div className="stat-num">52</div>
            <div className="stat-label label">Pitches per year</div>
          </div>
          <div className="stat">
            <div className="stat-num"><em>68%</em></div>
            <div className="stat-label label">Win rate</div>
          </div>
          <div className="stat">
            <div className="stat-num">150<em style={{ fontSize: ".7em" }}>+</em></div>
            <div className="stat-label label">Stocks researched</div>
          </div>
          <div className="stat">
            <div className="stat-num">2025</div>
            <div className="stat-label label">Founded</div>
          </div>
        </div>

        {/* ── ABOUT STRIP ── */}
        <section className="section">
          <div className="wrap two-col">
            <div>
              <span className="eyebrow">About</span>
              <h2 style={{ marginTop: 24 }}>A research-led approach to long-only equity investing</h2>
            </div>
            <div>
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
            </div>
          </div>
        </section>

        {/* ── PERFORMANCE ── */}
        <section className="section">
          <div className="wrap">
            <span className="eyebrow">Performance</span>
            <h2 style={{ marginTop: 24, maxWidth: "18ch" }}>Portfolio at a glance</h2>
            <div className="metric-grid" style={{ marginTop: 48 }}>
              <div className="metric">
                <div className="label">Total return YTD</div>
                <div className="metric-num up">+21<em style={{ fontSize: ".6em" }}>%</em></div>
                <p className="metric-cap">Fynoy Capital portfolio, year-to-date through latest close.</p>
              </div>
              <div className="metric">
                <div className="label">vs FTSE All-World</div>
                <div className="metric-num up">+17.4<em style={{ fontSize: ".6em" }}>%</em></div>
                <p className="metric-cap">Outperformance against the FTSE All-World index.</p>
              </div>
              <div className="metric">
                <div className="label">FTSE All-World YTD</div>
                <div className="metric-num up">+3.6<em style={{ fontSize: ".6em" }}>%</em></div>
                <p className="metric-cap">Benchmark return, year-to-date through latest close.</p>
              </div>
            </div>
            <p className="muted" style={{ marginTop: 24, fontSize: 12, maxWidth: "64ch" }}>
              Returns are unaudited and for informational purposes only. Past performance does not guarantee future results.
            </p>
          </div>
        </section>

        {/* ── APPROACH ── */}
        <section className="section">
          <div className="wrap">
            <span className="eyebrow">Our approach</span>
            <h2 style={{ marginTop: 24 }}>How Fynoy Capital invests</h2>
            <div className="approach-grid" style={{ marginTop: 48 }}>
              <div className="approach">
                <div className="approach-num">— 01</div>
                <h3>Bottom-up equity research</h3>
                <p>Every position begins with a written thesis: business model, competitive position, unit economics, valuation. No top-down trades.</p>
              </div>
              <div className="approach">
                <div className="approach-num">— 02</div>
                <h3>Weekly pitch sessions</h3>
                <p>Every Thursday, one stock is pitched live to the group. The thesis is challenged, refined or rejected before any capital moves.</p>
              </div>
              <div className="approach">
                <div className="approach-num">— 03</div>
                <h3>Concentrated portfolio</h3>
                <p>Conviction over diversification. We hold a small number of names where the work is deepest and the asymmetry is clearest.</p>
              </div>
              <div className="approach">
                <div className="approach-num">— 04</div>
                <h3>Independent &amp; transparent</h3>
                <p>No external mandates, no benchmarks dictating positions. Reports are shared openly with the research group ahead of every pitch.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="section">
          <div className="wrap">
            <span className="eyebrow">Process</span>
            <h2 style={{ marginTop: 24 }}>How it works</h2>
            <div className="steps" style={{ marginTop: 48 }}>
              <div className="step">
                <div className="step-num">1</div>
                <h4>Stock selected</h4>
                <p>A single name is chosen for the week, based on screening, news flow, or analyst conviction.</p>
              </div>
              <div className="step">
                <div className="step-num">2</div>
                <h4>Report published</h4>
                <p>A full written thesis is distributed to the research group ahead of the pitch session.</p>
              </div>
              <div className="step">
                <div className="step-num">3</div>
                <h4>Live pitch</h4>
                <p>Every Thursday the analyst defends the thesis live. Members ask, push back, and refine.</p>
              </div>
              <div className="step">
                <div className="step-num">4</div>
                <h4>Decision made</h4>
                <p>Buy, watch, or pass. If we buy, the position is sized and entered transparently.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA SPLIT ── */}
        <div className="cta-split">
          <div className="cta-card">
            <span className="eyebrow">Research group</span>
            <h2>Join Us</h2>
            <p>Follow the weekly research, attend Thursday pitches, and join a serious investor community. Free to join, no commitments.</p>
            <div className="cta-foot">
              <a
                className="btn btn-primary"
                target="_blank"
                rel="noopener noreferrer"
                href="https://wa.me/31682074482?text=Hi%2C%20I'd%20like%20to%20join%20the%20Fynoy%20Capital%20research%20group."
              >
                {WA_ICON} Join on WhatsApp
              </a>
            </div>
          </div>
          <div className="cta-card gold">
            <span className="eyebrow">Collaboration</span>
            <h2>Work With Us</h2>
            <p>Experienced traders collaborate with Fynoy Capital on a profit-sharing basis. We provide the research and capital. You provide the execution.</p>
            <div className="cta-foot">
              <a
                className="btn btn-on-gold"
                target="_blank"
                rel="noopener noreferrer"
                href="https://wa.me/31682074482?text=Hi%2C%20I'm%20interested%20in%20collaborating%20as%20a%20trader%20with%20Fynoy%20Capital."
              >
                {WA_ICON} Get in touch
              </a>
            </div>
          </div>
        </div>

      </main>
      <Footer />
    </>
  );
}
