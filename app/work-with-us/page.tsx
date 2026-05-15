import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { WA_ICON } from "../components/WaIcon";
import Reveal from "../components/Reveal";
import HeroOrbs from "../components/HeroOrbs";

export const metadata: Metadata = {
  title: "Work With Us",
  description:
    "Collaborate with Fynoy Capital as an independent trader. Profit-sharing basis. We provide the research and capital, you provide the execution.",
};

const REQUIREMENTS = [
  { title: "Proven track record", desc: "Demonstrable history of consistent, risk-adjusted returns across at least one full market cycle." },
  { title: "Clear trading strategy", desc: "A defined, repeatable approach with documented edge — not a collection of trades that happened to work." },
  { title: "Own broker setup", desc: "Traders operate through their own brokerage infrastructure. We do not provide trading platforms or execution venues." },
  { title: "Alignment with our approach", desc: "Disciplined, research-driven, long-term oriented. Comfortable with concentration and patient with conviction." },
  { title: "Professional attitude", desc: "Clear communication, accountability, and transparency. We work with people, not just track records." },
]

export default function WorkWithUsPage() {
  return (
    <>
      <Nav />
      <main>

        {/* ── HERO ── */}
        <header className="hero">
          <div className="grid-bg" />
          <HeroOrbs />
          <div className="wrap" style={{ position: "relative", zIndex: 1 }}>
            <span className="eyebrow" style={{ animation: "fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both" }}>Collaboration</span>
            <h1 style={{ animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both", animationDelay: "0.1s" }}>
              Trade alongside <em className="it">Fynoy Capital.</em>
            </h1>
            <p className="hero-sub lede" style={{ animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both", animationDelay: "0.25s" }}>
              Fynoy Capital works with a select group of independent traders on a profit-sharing basis.
              We provide the capital and the research. You provide the execution.
            </p>
            <span className="info-tag" style={{ animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both", animationDelay: "0.38s" }}>
              This is a collaboration, not employment. Fynoy Capital does not manage third-party capital.
            </span>
          </div>
        </header>

        {/* ── REQUIREMENTS ── */}
        <section className="section">
          <div className="wrap">
            <Reveal>
              <span className="eyebrow">Criteria</span>
              <h2 style={{ marginTop: 24 }}>What we look for</h2>
            </Reveal>
            <div className="req-list">
              {REQUIREMENTS.map((r, i) => (
                <Reveal key={i} delay={i * 80}>
                  <div className="req">
                    <span className="req-dot" />
                    <div className="req-title">{r.title}</div>
                    <p className="req-desc">{r.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── BIG CTA ── */}
        <section className="section">
          <div className="wrap">
            <Reveal>
              <div className="big-cta">
                <span className="eyebrow no-rule">WhatsApp</span>
                <h2>Interested in working together?</h2>
                <p>Send us a message on WhatsApp and tell us about your background, strategy, and what you're working on.</p>
                <a className="btn btn-primary" target="_blank" rel="noopener noreferrer"
                  href="https://wa.me/31682074482?text=Hi%2C%20I'm%20interested%20in%20collaborating%20as%20a%20trader%20with%20Fynoy%20Capital.">
                  {WA_ICON} Get in touch on WhatsApp
                </a>
              </div>
            </Reveal>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
