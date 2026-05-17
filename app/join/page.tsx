import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { WA_ICON } from "../components/WaIcon";
import Reveal from "../components/Reveal";
import HeroOrbs from "../components/HeroOrbs";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Join — volg ons portfolio gratis",
  description:
    "Maak gratis een account aan en volg het Fynoy Capital portfolio realtime. Optioneel: word lid van de WhatsApp community voor analyses en pitches.",
};

const RESEARCH_WA = "https://wa.me/31682074482?text=Hi%2C%20I'd%20like%20to%20join%20the%20Fynoy%20Capital%20research%20group.";

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
            <span className="eyebrow" style={{ animation: "fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both" }}>
              Volg ons portfolio
            </span>
            <h1 style={{ animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both", animationDelay: "0.1s" }}>
              Volg ons portfolio.<br />Leer hoe wij <em className="it">denken.</em>
            </h1>
            <p className="hero-sub lede" style={{ animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both", animationDelay: "0.25s" }}>
              Gratis toegang tot realtime trades, analyses en de redenering achter elke beslissing.
            </p>
            <div className="hero-cta" style={{ animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both", animationDelay: "0.45s" }}>
              <Link className="btn btn-primary" href="/auth/register">
                Maak gratis account
              </Link>
              <a className="btn btn-outline" target="_blank" rel="noopener noreferrer" href={RESEARCH_WA}>
                {WA_ICON} Word lid community
              </a>
            </div>
          </div>
        </header>

        {/* ── WAT JE KRIJGT ── */}
        <section className="section">
          <div className="wrap">
            <Reveal>
              <span className="eyebrow">Wat je krijgt</span>
              <h2 style={{ marginTop: 24, maxWidth: '20ch' }}>Twee niveaus van betrokkenheid</h2>
            </Reveal>
            <div className="check-grid" style={{ marginTop: 48, gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <Reveal>
                <div className="check">
                  <div className="check-circle">{CHECK_SVG}</div>
                  <h3>Gratis account</h3>
                  <p>Toegang tot het portfolio dashboard: alle open posities en rendementen, gesloten trades met exact rendement, performance vs VWCE, sector allocatie.</p>
                </div>
              </Reveal>
              <Reveal delay={100}>
                <div className="check">
                  <div className="check-circle">{CHECK_SVG}</div>
                  <h3>Community lid</h3>
                  <p>Wekelijkse analyses, pitches en directe toegang tot het team. Stel vragen, draag bij, leer mee — via de WhatsApp groep.</p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="section">
          <div className="wrap">
            <Reveal>
              <span className="eyebrow">Hoe het werkt</span>
              <h2 style={{ marginTop: 24, maxWidth: '20ch' }}>Drie stappen, geen verplichtingen</h2>
            </Reveal>
            <div className="steps" style={{ marginTop: 48, gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {[
                { n: "1", title: "Maak gratis account", body: "In één minuut. Dashboard direct beschikbaar." },
                { n: "2", title: "Word community lid", body: "Optioneel. WhatsApp groep voor analyses en pitches." },
                { n: "3", title: "Leer en bouw je visie", body: "Volg de trades, lees de redenering, ontwikkel je eigen aanpak." },
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
              <h2>Volg live. Gratis.</h2>
              <p>Maak een gratis account en open de portfolio realtime — open posities, gesloten trades, performance vs VWCE.</p>
            </div>
            <div className="cta-foot">
              <Link className="btn btn-primary" href="/auth/register">
                Maak gratis account →
              </Link>
            </div>
          </Reveal>
          <Reveal delay={100} className="cta-card gold" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <span className="eyebrow">Community</span>
              <h2>WhatsApp community</h2>
              <p>Analyses, pitches en discussie met de groep. Geen automatische signals — gewoon analyses, vragen en antwoorden.</p>
            </div>
            <div className="cta-foot">
              <a className="btn btn-on-gold" target="_blank" rel="noopener noreferrer" href={RESEARCH_WA}>
                {WA_ICON} Word lid via WhatsApp
              </a>
            </div>
          </Reveal>
        </div>

      </main>
      <Footer />
    </>
  );
}
