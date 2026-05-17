import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { WA_ICON } from "../components/WaIcon";
import Reveal from "../components/Reveal";
import HeroOrbs from "../components/HeroOrbs";

export const metadata: Metadata = {
  title: "Become an analyst — Fynoy Capital",
  description:
    "We're looking for analysts to write weekly research reports, present stock pitches, and build experience in a transparent investment team.",
};

const ANALYST_WA = "https://wa.me/31682074482?text=Hi%2C%20I'm%20interested%20in%20collaborating%20as%20a%20trader%20with%20Fynoy%20Capital.";

const PROFILE = [
  { title: "Analytical mind", desc: "Interested in fundamental analysis and writing structured investment theses." },
  { title: "Weekly cadence", desc: "Willing to produce a research report each week and deliver it on time." },
  { title: "Presentation", desc: "Comfortable presenting your analysis live during pitch sessions and absorbing feedback." },
  { title: "Drive > experience", desc: "No prior experience required. We look for opinion, curiosity and discipline." },
]

const BENEFITS = [
  { title: "Real-world experience", body: "End-to-end investment research workflow from idea to trade — documented and published." },
  { title: "Feedback from the team", body: "Constructive review of your theses, scoring decisions, and execution." },
  { title: "Public credit", body: "Your name as an analyst on the site and on every case you publish." },
  { title: "Tools and data", body: "Access to internal research tools, data feeds, and the full analysis library." },
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
            <span className="eyebrow" style={{ animation: "fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both" }}>Join the team</span>
            <h1 style={{ animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both", animationDelay: "0.1s" }}>
              Become an analyst at <em className="it">Fynoy Capital.</em>
            </h1>
            <p className="hero-sub lede" style={{ animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both", animationDelay: "0.25s" }}>
              We&apos;re looking for serious investors who want to write, pitch and learn — inside a
              transparent investment team that invests with its own capital.
            </p>
            <span className="info-tag" style={{ animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both", animationDelay: "0.38s" }}>
              A learning role with real-world experience. Not a salaried job, not wealth management.
            </span>
          </div>
        </header>

        {/* ── PROFILE ── */}
        <section className="section">
          <div className="wrap">
            <Reveal>
              <span className="eyebrow">What we look for</span>
              <h2 style={{ marginTop: 24 }}>Profile</h2>
            </Reveal>
            <div className="req-list">
              {PROFILE.map((r, i) => (
                <Reveal key={r.title} delay={i * 80}>
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

        {/* ── WHAT YOU BUILD ── */}
        <section className="section">
          <div className="wrap">
            <Reveal>
              <span className="eyebrow">What you build</span>
              <h2 style={{ marginTop: 24, maxWidth: '22ch' }}>What you get out of it</h2>
            </Reveal>
            <div className="check-grid" style={{ marginTop: 48, gridTemplateColumns: 'repeat(2, 1fr)' }}>
              {BENEFITS.map((b, i) => (
                <Reveal key={b.title} delay={i * 80}>
                  <div className="check">
                    <div className="check-circle">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8 L7 12 L13 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <h3>{b.title}</h3>
                    <p>{b.body}</p>
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
                <span className="eyebrow no-rule">Apply</span>
                <h2>Ready to build with us?</h2>
                <p>Send a WhatsApp message with a short intro: who you are, why you want to be an analyst, and which stock you would pitch this week.</p>
                <a className="btn btn-primary" target="_blank" rel="noopener noreferrer" href={ANALYST_WA}>
                  {WA_ICON} Apply via WhatsApp
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
