import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { WA_ICON } from "../components/WaIcon";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Fynoy Capital is an independent, research-led investment practice based in Rotterdam. Built on rigorous research and driven by long-only conviction.",
};

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main>

        {/* ── HERO ── */}
        <header className="hero">
          <div className="grid-bg" />
          <div className="wrap" style={{ position: "relative" }}>
            <span className="eyebrow">About Fynoy Capital</span>
            <h1>Built on research.<br />Driven by <em className="it">conviction.</em></h1>
            <p className="hero-sub lede">
              Fynoy Capital is an independent, research-led investment practice based in Rotterdam,
              investing only in names we have studied, pitched, and defended ourselves.
            </p>
          </div>
        </header>

        {/* ── KEY FACTS + COPY ── */}
        <section className="section">
          <div className="wrap two-col">
            <aside>
              <span className="eyebrow">Key facts</span>
              <div className="facts" style={{ marginTop: 24 }}>
                <div className="fact"><span className="fact-k">Founded</span><span className="fact-v">2025</span></div>
                <div className="fact"><span className="fact-k">Domicile</span><span className="fact-v">Rotterdam, NL</span></div>
                <div className="fact"><span className="fact-k">Registration</span><span className="fact-v">KvK 86136062</span></div>
                <div className="fact"><span className="fact-k">Broker</span><span className="fact-v">Interactive Brokers</span></div>
                <div className="fact"><span className="fact-k">Focus</span><span className="fact-v">Long-only equities</span></div>
                <div className="fact"><span className="fact-k">Pitch cadence</span><span className="fact-v">Weekly · Thursdays</span></div>
              </div>
            </aside>
            <div>
              <p>
                Fynoy Capital began as a personal investment practice — a single analyst, a notebook of theses,
                and the discipline to write everything down. Markets are noisy by default; conviction is built only
                by doing the work. Over time the notebook became a process, the process became a weekly cadence,
                and the cadence became Fynoy Capital.
              </p>
              <p>
                At the heart of the firm is the Thursday pitch. Every week, one stock is selected, researched in
                depth, and presented live to the group. Members read the report in advance, attend the session,
                and challenge the thesis in real time. Nothing enters the portfolio unsigned by that process.
              </p>
              <div className="pull">
                Every Thursday, a new stock. Every week, a sharper process.
              </div>
              <p>
                Our philosophy is unfashionable on purpose: long-only, concentrated, slow-moving, and openly
                documented. We are skeptical of diversification as a substitute for understanding, and skeptical
                of any thesis that cannot survive a live audience. We hold names where the work is deepest and
                the asymmetry is clearest, and we are comfortable holding cash when nothing meets the bar.
              </p>
              <p>
                Transparency is non-negotiable. Every pitch is documented. Every position has a written rationale.
                Members of the research group see the same reports we use to make decisions, in the same form,
                ahead of the same deadline. There is no privileged version.
              </p>
            </div>
          </div>
        </section>

        {/* ── PRINCIPLES ── */}
        <section className="section">
          <div className="wrap">
            <span className="eyebrow">Principles</span>
            <h2 style={{ marginTop: 24 }}>What guides every decision</h2>
            <div className="principles" style={{ marginTop: 48 }}>
              <div className="principle">
                <svg className="glyph" viewBox="0 0 40 40" fill="none">
                  <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1"/>
                  <path d="M12 20 L18 26 L28 14" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round"/>
                </svg>
                <h3>Research first</h3>
                <p>Every position begins with a written thesis. No idea enters the portfolio without surviving a live, structured pitch and rebuttal.</p>
              </div>
              <div className="principle">
                <svg className="glyph" viewBox="0 0 40 40" fill="none">
                  <rect x="6" y="6" width="28" height="28" stroke="currentColor" strokeWidth="1"/>
                  <path d="M6 14 H34 M6 22 H34 M6 30 H34" stroke="currentColor" strokeWidth="1" opacity=".5"/>
                </svg>
                <h3>Transparency</h3>
                <p>Reports, decisions, and outcomes are shared openly with the research group. The same materials we use to invest are the materials members read.</p>
              </div>
              <div className="principle">
                <svg className="glyph" viewBox="0 0 40 40" fill="none">
                  <path d="M20 4 L36 32 L4 32 Z" stroke="currentColor" strokeWidth="1"/>
                  <circle cx="20" cy="24" r="3" fill="currentColor"/>
                </svg>
                <h3>Conviction over diversification</h3>
                <p>We hold a small number of names where the work is deepest. We are skeptical of breadth as a substitute for understanding.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA SPLIT ── */}
        <div className="cta-split">
          <div className="cta-card">
            <span className="eyebrow">Research group</span>
            <h2>Join Us</h2>
            <p>Follow the weekly research, attend Thursday pitches, and join a serious investor community. Free to join.</p>
            <div className="cta-foot">
              <a className="btn btn-primary" target="_blank" rel="noopener noreferrer"
                href="https://wa.me/31682074482?text=Hi%2C%20I'd%20like%20to%20join%20the%20Fynoy%20Capital%20research%20group.">
                {WA_ICON} Join on WhatsApp
              </a>
            </div>
          </div>
          <div className="cta-card gold">
            <span className="eyebrow">Collaboration</span>
            <h2>Work With Us</h2>
            <p>Experienced traders collaborate with Fynoy Capital on a profit-sharing basis.</p>
            <div className="cta-foot">
              <a className="btn btn-on-gold" target="_blank" rel="noopener noreferrer"
                href="https://wa.me/31682074482?text=Hi%2C%20I'm%20interested%20in%20collaborating%20as%20a%20trader%20with%20Fynoy%20Capital.">
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
