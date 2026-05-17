import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { WA_ICON } from "../components/WaIcon";
import Reveal from "../components/Reveal";
import HeroOrbs from "../components/HeroOrbs";

export const metadata: Metadata = {
  title: "Word analist — Fynoy Capital",
  description:
    "We zoeken analisten die wekelijks research reports schrijven, stock pitches presenteren en praktijkervaring opbouwen in een transparant investment team.",
};

const ANALYST_WA = "https://wa.me/31682074482?text=Hi%2C%20I'm%20interested%20in%20collaborating%20as%20a%20trader%20with%20Fynoy%20Capital.";

const PROFILE = [
  { title: "Analytisch denker", desc: "Interesse in fundamentele analyse en het schrijven van gestructureerde theses." },
  { title: "Wekelijks ritme", desc: "Bereid om wekelijks een research report te schrijven en op tijd op te leveren." },
  { title: "Presentatie", desc: "Wil je analyse live presenteren tijdens de pitch sessies en feedback opnemen." },
  { title: "Gedrevenheid > ervaring", desc: "Geen ervaring vereist. Wel: eigen mening, leergierigheid en discipline." },
]

const BENEFITS = [
  { title: "Praktijkervaring", body: "Echte investment research workflow van idee tot trade. Gedocumenteerd en gepubliceerd." },
  { title: "Feedback van het team", body: "Constructief commentaar op je analyses, scoringssystemen en uitvoering." },
  { title: "Publieke vermelding", body: "Je naam als analist op de website en bij elke case die je schrijft." },
  { title: "Tools en data", body: "Toegang tot alle interne research tools, data feeds en analyses." },
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
            <span className="eyebrow" style={{ animation: "fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both" }}>
              Word onderdeel van het team
            </span>
            <h1 style={{ animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both", animationDelay: "0.1s" }}>
              Word analist bij <em className="it">Fynoy Capital.</em>
            </h1>
            <p className="hero-sub lede" style={{ animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both", animationDelay: "0.25s" }}>
              We zoeken serieuze beleggers die willen schrijven, pitchen en leren — in een transparant
              investment team dat met eigen geld belegt.
            </p>
            <span className="info-tag" style={{ animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both", animationDelay: "0.38s" }}>
              Dit is een leerplek met praktijkervaring. Geen vaste loondienst, geen vermogensbeheer.
            </span>
          </div>
        </header>

        {/* ── PROFIEL ── */}
        <section className="section">
          <div className="wrap">
            <Reveal>
              <span className="eyebrow">Wat we zoeken</span>
              <h2 style={{ marginTop: 24 }}>Profiel</h2>
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

        {/* ── WAT JE KRIJGT ── */}
        <section className="section">
          <div className="wrap">
            <Reveal>
              <span className="eyebrow">Wat je krijgt</span>
              <h2 style={{ marginTop: 24, maxWidth: '22ch' }}>Wat je hier opbouwt</h2>
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
                <span className="eyebrow no-rule">Solliciteer</span>
                <h2>Klaar om mee te bouwen?</h2>
                <p>Stuur een bericht via WhatsApp met een korte intro: wie je bent, waarom je analist wilt worden en welk aandeel je deze week zou willen pitchen.</p>
                <a className="btn btn-primary" target="_blank" rel="noopener noreferrer" href={ANALYST_WA}>
                  {WA_ICON} Solliciteer via WhatsApp
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
