import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { WA_ICON } from "../components/WaIcon";
import Reveal from "../components/Reveal";
import Link from "next/link";
import HeroOrbs from "../components/HeroOrbs";

export const metadata: Metadata = {
  title: "Over Fynoy Capital",
  description:
    "Fynoy Capital is een transparant investment research platform opgericht door Alex Nijland. Wij beleggen met eigen geld en delen elke trade realtime.",
};

const RESEARCH_WA = "https://wa.me/31682074482?text=Hi%2C%20I'd%20like%20to%20join%20the%20Fynoy%20Capital%20research%20group.";

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
            <span className="eyebrow" style={{ animation: "fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both" }}>
              Over Fynoy Capital
            </span>
            <h1 style={{ animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both", animationDelay: "0.1s" }}>
              Beleggen met<br />eigen geld, in de <em className="it">open lucht.</em>
            </h1>
            <p className="hero-sub lede" style={{ animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both", animationDelay: "0.25s" }}>
              Fynoy Capital is een transparant investment research platform opgericht door Alex Nijland.
              Geen fund. Geen vermogensbeheer. Geen blinde copy trading.
            </p>
          </div>
        </header>

        {/* ── MISSIE / FACTS ── */}
        <section className="section">
          <div className="wrap two-col">
            <Reveal>
              <aside>
                <span className="eyebrow">Key facts</span>
                <div className="facts" style={{ marginTop: 24 }}>
                  {[
                    ["Opgericht", "2025"],
                    ["Vestiging", "Rotterdam, NL"],
                    ["KvK", "86136062"],
                    ["Broker", "Interactive Brokers"],
                    ["Focus", "Long-only equities"],
                    ["Track record", "Vanaf 1 jan 2026"],
                  ].map(([k, v], i) => (
                    <div key={i} className="fact"><span className="fact-k">{k}</span><span className="fact-v">{v}</span></div>
                  ))}
                </div>
              </aside>
            </Reveal>
            <Reveal delay={120}>
              <p>
                Wij beleggen met eigen kapitaal en delen elke trade, elke analyse en elke redenering realtime
                met ons publiek. Geen fund. Geen vermogensbeheer. Geen blinde copy trading. Onze missie is
                simpel: transparantie normaliseren in de beleggingswereld.
              </p>
              <p>
                De meeste &quot;influencers&quot; en research clubs delen alleen de winnaars. Wij delen alles —
                inclusief de fouten, de afgekeurde theses en de gemiste calls. Dat is de enige manier waarop
                je echt kan leren hoe een belegger denkt.
              </p>
              <div className="pull">
                Wij beleggen met eigen geld. Onze fouten zijn echt, onze winsten ook.
              </div>
              <p>
                Elke positie begint met een gedocumenteerde case: fundamenteel onderzoek, technische analyse,
                risk/reward, entry/exit plan. Die case wordt gepubliceerd in het dashboard zodra de trade
                geplaatst is. Later — bij take-profit, stop-loss of vrijwillig sluiten — schrijven we een
                post-trade reflectie. Klopte de thesis? Wat hadden we beter kunnen zien?
              </p>
            </Reveal>
          </div>
        </section>

        {/* ── TEAM ── */}
        <section className="section">
          <div className="wrap">
            <Reveal>
              <span className="eyebrow">Team</span>
              <h2 style={{ marginTop: 24, maxWidth: '24ch' }}>Wie er achter Fynoy Capital zit</h2>
            </Reveal>
            <div className="principles" style={{ marginTop: 48, gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <Reveal>
                <div className="principle">
                  <svg className="glyph" viewBox="0 0 40 40" fill="none">
                    <circle cx="20" cy="14" r="6" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M8 34 C8 26 14 23 20 23 C26 23 32 26 32 34" stroke="currentColor" strokeWidth="1.2" fill="none" />
                  </svg>
                  <h3>Alex Nijland</h3>
                  <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-dim)', marginBottom: 4 }}>
                    Oprichter &amp; Portfolio Manager
                  </p>
                  <p>&ldquo;Ik beleg met eigen geld en deel alles. Fouten en successen. Dat is de enige manier om geloofwaardig te zijn.&rdquo;</p>
                </div>
              </Reveal>
              <Reveal delay={100}>
                <div className="principle">
                  <svg className="glyph" viewBox="0 0 40 40" fill="none">
                    <path d="M6 32 L14 24 L20 28 L34 12" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M28 12 L34 12 L34 18" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <h3>Analisten</h3>
                  <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-dim)', marginBottom: 4 }}>
                    In opbouw
                  </p>
                  <p>
                    We zijn altijd op zoek naar analisten die willen schrijven, pitchen en leren.{' '}
                    <Link href="/work-with-us" style={{ color: 'var(--gold)' }}>Word analist →</Link>
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── ROADMAP ── */}
        <section className="section">
          <div className="wrap">
            <Reveal>
              <span className="eyebrow">Roadmap</span>
              <h2 style={{ marginTop: 24, maxWidth: '22ch' }}>Hoe we groeien — in fases</h2>
            </Reveal>
            <div className="steps" style={{ marginTop: 48, gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <Reveal>
                <div className="step">
                  <div className="step-num">I</div>
                  <h4>Fase 1 · 2026</h4>
                  <p>Track record bouwen, community laten groeien — alles volledig gratis. Bewijzen dat ons proces werkt.</p>
                </div>
              </Reveal>
              <Reveal delay={100}>
                <div className="step">
                  <div className="step-num">II</div>
                  <h4>Fase 2 · 2027+</h4>
                  <p>Pro tier introduceren na 12-18 maanden aantoonbaar boven marktrendement. Free tier blijft beschikbaar.</p>
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
              <h2>Volg live. Gratis.</h2>
              <p>Maak een gratis account en open de portfolio realtime — elke positie, elke gesloten trade, performance vs VWCE.</p>
            </div>
            <div className="cta-foot">
              <Link className="btn btn-primary" href="/auth/register">
                Maak gratis account →
              </Link>
              <a className="btn btn-outline" target="_blank" rel="noopener noreferrer" href={RESEARCH_WA}>
                {WA_ICON} Word lid community
              </a>
            </div>
          </Reveal>
          <Reveal delay={100} className="cta-card gold" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <span className="eyebrow">Word analist</span>
              <h2>Werk mee in het team</h2>
              <p>Schrijf research reports, presenteer stock pitches en bouw ervaring op in een echt investment team.</p>
            </div>
            <div className="cta-foot">
              <Link className="btn btn-on-gold" href="/work-with-us">
                Bekijk profiel →
              </Link>
            </div>
          </Reveal>
        </div>

      </main>
      <Footer />
    </>
  );
}
