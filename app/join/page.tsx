import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { WA_ICON } from "../components/WaIcon";
import Reveal from "../components/Reveal";
import HeroOrbs from "../components/HeroOrbs";
import Link from "next/link";
import { WA_RESEARCH as RESEARCH_WA } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Join — follow our portfolio for free",
  description:
    "Create a free account and follow the Fynoy Capital portfolio in real time. Optional: join the WhatsApp community for analyses and pitches.",
};

const CHECK_SVG = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M3 8 L7 12 L13 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function JoinPage() {
  return (
    <>
      <Nav />
      <main>

        {/* ── HERO ── */}
        <header className="hero">
          <div className="grid-bg" />
          <HeroOrbs />
          <div className="wrap" style={{ position: "relative", zIndex: 1 }}>
            <span className="eyebrow" style={{ animation: "fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both" }}>Follow our portfolio</span>
            <h1 style={{ animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both", animationDelay: "0.1s" }}>
              Follow the portfolio.<br />Learn how we <em className="it">think.</em>
            </h1>
            <p className="hero-sub lede" style={{ animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both", animationDelay: "0.25s" }}>
              Free access to realtime trades, analyses, and the reasoning behind every decision.
            </p>
            <div className="hero-cta" style={{ animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both", animationDelay: "0.45s" }}>
              <Link className="btn btn-primary" href="/auth/register">
                Create free account
              </Link>
              <a className="btn btn-outline" target="_blank" rel="noopener noreferrer" href={RESEARCH_WA}>
                {WA_ICON} Join community
              </a>
            </div>
          </div>
        </header>

        {/* ── WHAT YOU GET ── */}
        <section className="section">
          <div className="wrap">
            <Reveal>
              <span className="eyebrow">What you get</span>
              <h2 style={{ marginTop: 24, maxWidth: '20ch' }}>Two ways to be involved</h2>
            </Reveal>
            <div className="check-grid" style={{ marginTop: 48, gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <Reveal>
                <div className="check">
                  <div className="check-circle">{CHECK_SVG}</div>
                  <h3>Free account</h3>
                  <p>Access the portfolio dashboard: all open positions with live returns, closed trades with exact P&amp;L, performance vs VWCE and sector allocation.</p>
                </div>
              </Reveal>
              <Reveal delay={100}>
                <div className="check">
                  <div className="check-circle">{CHECK_SVG}</div>
                  <h3>Community member</h3>
                  <p>Weekly analyses, pitches and direct access to the team. Ask questions, contribute, learn along — through the WhatsApp group.</p>
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
              <h2 style={{ marginTop: 24, maxWidth: '20ch' }}>Three steps, no commitments</h2>
            </Reveal>
            <div className="steps" style={{ marginTop: 48, gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {[
                { n: "1", title: "Create free account", body: "Takes a minute. Dashboard is available immediately." },
                { n: "2", title: "Join the community", body: "Optional. WhatsApp group for analyses and pitches." },
                { n: "3", title: "Learn and build your view", body: "Follow the trades, read the rationale, develop your own approach." },
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

        {/* ── CTA SPLIT ── */}
        <div className="cta-split">
          <Reveal className="cta-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <span className="eyebrow">Portfolio dashboard</span>
              <h2>Track live. For free.</h2>
              <p>Create a free account and follow the portfolio in real time — open positions, closed trades, performance vs VWCE.</p>
            </div>
            <div className="cta-foot">
              <Link className="btn btn-primary" href="/auth/register">
                Create free account →
              </Link>
            </div>
          </Reveal>
          <Reveal delay={100} className="cta-card gold" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <span className="eyebrow">Community</span>
              <h2>WhatsApp community</h2>
              <p>Analyses, pitches, and discussion with the group. No automated signals — analysis, questions, and answers.</p>
            </div>
            <div className="cta-foot">
              <a className="btn btn-on-gold" target="_blank" rel="noopener noreferrer" href={RESEARCH_WA}>
                {WA_ICON} Join via WhatsApp
              </a>
            </div>
          </Reveal>
        </div>

      </main>
      <Footer />
    </>
  );
}
