import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { WA_ICON } from "../components/WaIcon";

export const metadata: Metadata = {
  title: "Work With Us",
  description:
    "Collaborate with Fynoy Capital as an independent trader. Profit-sharing basis. We provide the research and capital, you provide the execution.",
};

export default function WorkWithUsPage() {
  return (
    <>
      <Nav />
      <main>

        {/* ── HERO ── */}
        <header className="hero">
          <div className="grid-bg" />
          <div className="wrap" style={{ position: "relative" }}>
            <span className="eyebrow">Collaboration</span>
            <h1>Trade alongside <em className="it">Fynoy Capital.</em></h1>
            <p className="hero-sub lede">
              Fynoy Capital works with a select group of independent traders on a profit-sharing basis.
              We provide the capital and the research. You provide the execution.
            </p>
            <span className="info-tag">This is a collaboration, not employment. Fynoy Capital does not manage third-party capital.</span>
          </div>
        </header>

        {/* ── REQUIREMENTS ── */}
        <section className="section">
          <div className="wrap">
            <span className="eyebrow">Criteria</span>
            <h2 style={{ marginTop: 24 }}>What we look for</h2>
            <div className="req-list">
              <div className="req">
                <span className="req-dot" />
                <div className="req-title">Proven track record</div>
                <p className="req-desc">Demonstrable history of consistent, risk-adjusted returns across at least one full market cycle.</p>
              </div>
              <div className="req">
                <span className="req-dot" />
                <div className="req-title">Clear trading strategy</div>
                <p className="req-desc">A defined, repeatable approach with documented edge — not a collection of trades that happened to work.</p>
              </div>
              <div className="req">
                <span className="req-dot" />
                <div className="req-title">Own broker setup</div>
                <p className="req-desc">Traders operate through their own brokerage infrastructure. We do not provide trading platforms or execution venues.</p>
              </div>
              <div className="req">
                <span className="req-dot" />
                <div className="req-title">Alignment with our approach</div>
                <p className="req-desc">Disciplined, research-driven, long-term oriented. Comfortable with concentration and patient with conviction.</p>
              </div>
              <div className="req">
                <span className="req-dot" />
                <div className="req-title">Professional attitude</div>
                <p className="req-desc">Clear communication, accountability, and transparency. We work with people, not just track records.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── BIG CTA ── */}
        <section className="section">
          <div className="wrap">
            <div className="big-cta">
              <span className="eyebrow no-rule">WhatsApp</span>
              <h2>Interested in working together?</h2>
              <p>Send us a message on WhatsApp and tell us about your background, strategy, and what you're working on.</p>
              <a className="btn btn-primary" target="_blank" rel="noopener noreferrer"
                href="https://wa.me/31682074482?text=Hi%2C%20I'm%20interested%20in%20collaborating%20as%20a%20trader%20with%20Fynoy%20Capital.">
                {WA_ICON} Get in touch on WhatsApp
              </a>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
