import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { WA_ICON } from "../components/WaIcon";
import Reveal from "../components/Reveal";
import HeroOrbs from "../components/HeroOrbs";

export const metadata: Metadata = {
  title: "Join Us",
  description:
    "Join the Fynoy Capital research group. Receive weekly stock reports, attend live Thursday pitch sessions, and access our WhatsApp investor community. Free to join.",
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
            <span className="eyebrow" style={{ animation: "fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both" }}>Research group</span>
            <h1 style={{ animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both", animationDelay: "0.1s" }}>
              Follow the research.<br />Attend the <em className="it">pitches.</em>
            </h1>
            <p className="hero-sub lede" style={{ animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both", animationDelay: "0.25s" }}>
              Joining Fynoy Capital means receiving the weekly research report before each Thursday pitch session,
              attending the live discussion, and joining a community of serious investors who treat markets as a
              craft rather than a casino.
            </p>
            <p className="lede" style={{ marginTop: 18, animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both", animationDelay: "0.35s" }}>
              Members are expected to read the report, show up, and contribute. We keep the group small and
              focused on people who genuinely want to think harder about individual companies.
            </p>
            <p className="free-line" style={{ animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both", animationDelay: "0.45s" }}>
              Free to join. No commitments. No fees.
            </p>
          </div>
        </header>

        {/* ── BIG CTA ── */}
        <section className="section">
          <div className="wrap">
            <Reveal>
              <div className="big-cta">
                <span className="eyebrow no-rule">WhatsApp</span>
                <h2>Ready to join?</h2>
                <p>Send us a message on WhatsApp and we'll add you to the research group ahead of this week's pitch.</p>
                <a className="btn btn-primary" target="_blank" rel="noopener noreferrer"
                  href="https://wa.me/31682074482?text=Hi%2C%20I'd%20like%20to%20join%20the%20Fynoy%20Capital%20research%20group.">
                  {WA_ICON} Join on WhatsApp
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── WHAT'S INCLUDED ── */}
        <section className="section">
          <div className="wrap">
            <Reveal>
              <span className="eyebrow">What's included</span>
              <h2 style={{ marginTop: 24 }}>Everything you need to follow the process</h2>
            </Reveal>
            <div className="check-grid" style={{ marginTop: 48 }}>
              {[
                { title: "Weekly research report", body: "A full written stock analysis is delivered before each Thursday pitch — thesis, financials, valuation, and the key risks we are watching." },
                { title: "Live Thursday pitch sessions", body: "Attend the pitch, question the thesis, and engage with the process. Members are invited to push back, propose counter-views, and stress-test the work." },
                { title: "WhatsApp group access", body: "Direct access to reports, mid-week updates, position changes, and the broader investment community on WhatsApp." },
              ].map((item, i) => (
                <Reveal key={i} delay={i * 100}>
                  <div className="check">
                    <div className="check-circle">{CHECK_SVG}</div>
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
                { n: "1", title: "Stock selected", body: "A single name is chosen each week." },
                { n: "2", title: "Report published", body: "Full written thesis sent to the group." },
                { n: "3", title: "Live pitch", body: "Thursday session, open to all members." },
                { n: "4", title: "Decision made", body: "Buy, watch, or pass — transparently." },
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

      </main>
      <Footer />
    </>
  );
}
