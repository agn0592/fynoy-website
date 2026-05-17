import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { WA_ICON } from "../components/WaIcon";
import Reveal from "../components/Reveal";
import Link from "next/link";
import HeroOrbs from "../components/HeroOrbs";
import { WA_RESEARCH as RESEARCH_WA } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About Fynoy Capital",
  description:
    "Fynoy Capital is a transparent investment research platform. We invest with our own money and share every trade in real time.",
};

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main>

        {/* ── HERO ── */}
        <header className="hero">
          <div className="grid-bg" />
          <HeroOrbs />
          <div className="wrap" style={{ position: "relative", zIndex: 1 }}>
            <span className="eyebrow" style={{ animation: "fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both" }}>About Fynoy Capital</span>
            <h1 style={{ animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both", animationDelay: "0.1s" }}>
              Investing with<br />our own money,<br />in the <em className="it">open.</em>
            </h1>
            <p className="hero-sub lede" style={{ animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both", animationDelay: "0.25s" }}>
              Fynoy Capital is a transparent investment research platform.
              No fund. No wealth management. No blind copy trading.
            </p>
          </div>
        </header>

        {/* ── MISSION / FACTS ── */}
        <section className="section">
          <div className="wrap two-col">
            <Reveal>
              <aside>
                <span className="eyebrow">Key facts</span>
                <div className="facts" style={{ marginTop: 24 }}>
                  {[
                    ["Founded", "2025"],
                    ["Domicile", "Rotterdam, NL"],
                    ["Registration", "KvK 86136062"],
                    ["Broker", "Interactive Brokers"],
                    ["Focus", "Long-only equities"],
                    ["Track record", "From 1 Jan 2026"],
                  ].map(([k, v], i) => (
                    <div key={i} className="fact"><span className="fact-k">{k}</span><span className="fact-v">{v}</span></div>
                  ))}
                </div>
              </aside>
            </Reveal>
            <Reveal delay={120}>
              <p>
                We invest with our own capital and share every trade, every analysis and every rationale
                in real time. No fund. No wealth management. No blind copy trading. Our mission is simple:
                make transparency the default in investing.
              </p>
              <p>
                Most &quot;influencers&quot; and research clubs share only the winners. We share everything —
                including the mistakes, the theses we rejected, and the calls we missed. That is the only
                way to really learn how an investor thinks.
              </p>
              <div className="pull">
                We invest with our own money. Our mistakes are real, and so are our wins.
              </div>
              <p>
                Every position starts with a documented case: fundamental research, technical analysis,
                risk/reward, entry and exit plan. The case is published in the dashboard the moment the
                trade is placed. Later — at take-profit, stop-loss, or a voluntary close — we write a
                post-trade reflection. Did the thesis hold? What could we have seen earlier?
              </p>
            </Reveal>
          </div>
        </section>

        {/* ── PRINCIPLES ── */}
        <section className="section">
          <div className="wrap">
            <Reveal>
              <span className="eyebrow">Principles</span>
              <h2 style={{ marginTop: 24 }}>What guides every decision</h2>
            </Reveal>
            <div className="principles" style={{ marginTop: 48 }}>
              {[
                {
                  svg: <svg className="glyph" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1"/><path d="M12 20 L18 26 L28 14" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round"/></svg>,
                  title: "Research first",
                  body: "Every position begins with a written thesis. No idea enters the portfolio without a documented case covering fundamentals, valuation, risks and an explicit plan.",
                },
                {
                  svg: <svg className="glyph" viewBox="0 0 40 40" fill="none"><rect x="6" y="6" width="28" height="28" stroke="currentColor" strokeWidth="1"/><path d="M6 14 H34 M6 22 H34 M6 30 H34" stroke="currentColor" strokeWidth="1" opacity=".5"/></svg>,
                  title: "Transparency",
                  body: "Reports, decisions, and positions are open to all members — a live portfolio dashboard with every trade, every P&L, and the reasoning behind it. No black box.",
                },
                {
                  svg: <svg className="glyph" viewBox="0 0 40 40" fill="none"><path d="M20 4 L36 32 L4 32 Z" stroke="currentColor" strokeWidth="1"/><circle cx="20" cy="24" r="3" fill="currentColor"/></svg>,
                  title: "Conviction over diversification",
                  body: "We hold a small number of names where the work is deepest. Concentration backed by evidence, not breadth as a substitute for understanding.",
                },
              ].map((p, i) => (
                <Reveal key={i} delay={i * 100}>
                  <div className="principle">
                    {p.svg}
                    <h3>{p.title}</h3>
                    <p>{p.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── ROADMAP ── */}
        <section className="section">
          <div className="wrap">
            <Reveal>
              <span className="eyebrow">Roadmap</span>
              <h2 style={{ marginTop: 24, maxWidth: '22ch' }}>How we grow — in phases</h2>
            </Reveal>
            <div className="steps" style={{ marginTop: 48, gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <Reveal>
                <div className="step">
                  <div className="step-num">I</div>
                  <h4>Phase 1 · 2026</h4>
                  <p>Build the track record and grow the community. Everything stays free. Prove the process works in public.</p>
                </div>
              </Reveal>
              <Reveal delay={100}>
                <div className="step">
                  <div className="step-num">II</div>
                  <h4>Phase 2 · 2027+</h4>
                  <p>Expand the team with more analysts, deepen the research library, and keep building in the open.</p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── CTA SPLIT ── */}
        <div className="cta-split">
          <Reveal className="cta-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <span className="eyebrow">Portfolio dashboard</span>
              <h2>Track live. For free.</h2>
              <p>Create a free account to follow the portfolio in real time — every position, every closed trade, performance vs VWCE.</p>
            </div>
            <div className="cta-foot">
              <Link className="btn btn-primary" href="/auth/register">
                Create free account →
              </Link>
              <a className="btn btn-outline" target="_blank" rel="noopener noreferrer" href={RESEARCH_WA}>
                {WA_ICON} Join community
              </a>
            </div>
          </Reveal>
          <Reveal delay={100} className="cta-card gold" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <span className="eyebrow">Become an analyst</span>
              <h2>Work inside the team</h2>
              <p>Write research reports, present stock pitches and build experience inside a real investment team.</p>
            </div>
            <div className="cta-foot">
              <Link className="btn btn-on-gold" href="/work-with-us">
                See the role →
              </Link>
            </div>
          </Reveal>
        </div>

      </main>
      <Footer />
    </>
  );
}
