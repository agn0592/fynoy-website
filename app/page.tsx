import type { Metadata } from "next";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import { WA_ICON } from "./components/WaIcon";
import Link from "next/link";
import Reveal from "./components/Reveal";
import HeroOrbs from "./components/HeroOrbs";

export const metadata: Metadata = {
  title: "Fynoy Capital — wij beleggen met eigen geld, in de open lucht",
  description:
    "Fynoy Capital deelt zijn volledige portfolio realtime: elke trade, elke redenering, vs VWCE benchmark. Gratis te volgen. Geen advies — jij beslist zelf.",
};

const RESEARCH_WA = "https://wa.me/31682074482?text=Hi%2C%20I'd%20like%20to%20join%20the%20Fynoy%20Capital%20research%20group.";
const ANALYST_WA  = "https://wa.me/31682074482?text=Hi%2C%20I'm%20interested%20in%20collaborating%20as%20a%20trader%20with%20Fynoy%20Capital.";

export default function HomePage() {
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
              Transparant investment research
            </span>
            <h1 style={{ animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both", animationDelay: "0.1s" }}>
              Wij beleggen<br />met <em className="it">eigen geld.</em>
            </h1>
            <p className="hero-sub lede" style={{ animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both", animationDelay: "0.25s" }}>
              Elke trade. Elke redenering. Realtime.
            </p>
            <p className="lede" style={{ marginTop: 18, maxWidth: '56ch', animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both", animationDelay: "0.35s" }}>
              Fynoy Capital deelt zijn volledige portfolio — open posities, gesloten trades en de analyse achter
              elke beslissing. Geen blinde copy trading. Jij leert hoe wij denken en bepaalt altijd zelf.
            </p>
            <div className="hero-cta" style={{ animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both", animationDelay: "0.45s" }}>
              <Link className="btn btn-primary" href="/auth/register">
                Volg ons portfolio gratis
              </Link>
              <Link className="btn btn-outline" href="/auth/login">
                Naar het dashboard
              </Link>
            </div>
          </div>
        </header>

        {/* ── WAAROM ── */}
        <section className="section">
          <div className="wrap">
            <Reveal>
              <span className="eyebrow">Waarom Fynoy Capital</span>
              <h2 style={{ marginTop: 24, maxWidth: "20ch" }}>Drie redenen die de rest niet biedt</h2>
            </Reveal>
            <div className="principles" style={{ marginTop: 48 }}>
              {[
                {
                  glyph: (
                    <svg className="glyph" viewBox="0 0 40 40" fill="none">
                      <circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="1.2" />
                      <path d="M14 20 L18 24 L26 16" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
                    </svg>
                  ),
                  title: "Skin in the game",
                  body: "We beleggen met eigen kapitaal. Onze resultaten zijn echt, onze consequenties ook. Geen theoretische picks of geleende voorbeelden.",
                },
                {
                  glyph: (
                    <svg className="glyph" viewBox="0 0 40 40" fill="none">
                      <circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="1.2" />
                      <circle cx="20" cy="20" r="3.5" fill="currentColor" />
                      <path d="M6 20 H10 M30 20 H34 M20 6 V10 M20 30 V34" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  ),
                  title: "Volledige transparantie",
                  body: "Je ziet elke positie, elke redenering, elke fout — realtime. Niets wordt verborgen of achteraf herschreven.",
                },
                {
                  glyph: (
                    <svg className="glyph" viewBox="0 0 40 40" fill="none">
                      <path d="M8 30 L8 12 L16 12 L16 22 L24 22 L24 8 L32 8 L32 30 Z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
                    </svg>
                  ),
                  title: "Leer zelf beleggen",
                  body: "We faciliteren geen automatisch kopiëren. Je ziet wat we doen en waarom. Beslissingen blijven van jou.",
                },
              ].map((p, i) => (
                <Reveal key={p.title} delay={i * 100}>
                  <div className="principle">
                    {p.glyph}
                    <h3>{p.title}</h3>
                    <p>{p.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOE HET WERKT ── */}
        <section className="section">
          <div className="wrap">
            <Reveal>
              <span className="eyebrow">Hoe het werkt</span>
              <h2 style={{ marginTop: 24, maxWidth: "20ch" }}>Van research naar realtime trade</h2>
            </Reveal>
            <div className="steps" style={{ marginTop: 48 }}>
              {[
                { n: "1", title: "Research", body: "Fundamentele analyse, technische analyse en risicobeoordeling per aandeel. Volledig gedocumenteerd." },
                { n: "2", title: "Trade", body: "Order met eigen geld. Entry, take profit en stop loss worden vooraf vastgelegd." },
                { n: "3", title: "Realtime", body: "Je ziet de trade direct in het dashboard, inclusief de redenering achter de beslissing." },
                { n: "4", title: "Leer", body: "Volg het verloop, zie hoe we omgaan met winst en verlies, ontwikkel je eigen visie." },
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

        {/* ── PERFORMANCE TEASER ── */}
        <section className="section">
          <div className="wrap">
            <Reveal>
              <span className="eyebrow">Performance</span>
              <h2 style={{ marginTop: 24, maxWidth: "20ch" }}>Track record vanaf 1 januari 2026</h2>
            </Reveal>
            <Reveal delay={120}>
              <p className="lede" style={{ marginTop: 18, maxWidth: '60ch' }}>
                We bouwen het track record in de open lucht. Voor live cijfers — portfolio TWR, VWCE benchmark,
                win rate, gemiddeld rendement per trade — maak een gratis account aan.
              </p>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 28 }}>
                <Link href="/auth/register" className="btn btn-primary">Bekijk live performance →</Link>
                <Link href="/auth/login" className="btn btn-outline">Login</Link>
              </div>
            </Reveal>
            <p className="muted" style={{ marginTop: 32, fontSize: 12, maxWidth: "64ch" }}>
              Rendementen uit het verleden bieden geen garantie voor de toekomst. Fynoy Capital doet aan publieke research,
              geen vermogensbeheer.
            </p>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section className="section">
          <div className="wrap">
            <Reveal>
              <span className="eyebrow">Pricing</span>
              <h2 style={{ marginTop: 24, maxWidth: "22ch" }}>Gratis zolang we het bewijs bouwen.</h2>
              <p className="lede" style={{ marginTop: 18, maxWidth: '60ch' }}>
                Fase 1 is volledig gratis. Na 12-18 maanden aantoonbaar boven marktrendement introduceren we Pro.
              </p>
            </Reveal>

            <div className="pricing-grid" style={{ marginTop: 48 }}>
              <Reveal>
                <div className="pricing-card">
                  <div className="pricing-head">
                    <div className="pricing-name">Free</div>
                    <div className="pricing-price"><span>€0</span> / maand</div>
                  </div>
                  <ul className="pricing-feats">
                    <li><span className="check">✓</span> Toegang tot portfolio dashboard</li>
                    <li><span className="check">✓</span> Open posities met % rendement</li>
                    <li><span className="check">✓</span> Gesloten trades historiek</li>
                    <li><span className="check">✓</span> Performance vs VWCE</li>
                    <li><span className="check">✓</span> Sector allocatie</li>
                    <li><span className="check tilde">~</span> Vertraagde trade updates (einde dag)</li>
                    <li><span className="check tilde">~</span> Beperkte analyse detail</li>
                  </ul>
                  <Link className="btn btn-primary" href="/auth/register" style={{ width: '100%', justifyContent: 'center' }}>
                    Maak gratis account
                  </Link>
                </div>
              </Reveal>

              <Reveal delay={100}>
                <div className="pricing-card pricing-card-pro">
                  <div className="pricing-badge">Coming soon</div>
                  <div className="pricing-head">
                    <div className="pricing-name">Pro</div>
                    <div className="pricing-price"><span>€15</span> / maand</div>
                  </div>
                  <ul className="pricing-feats">
                    <li><span className="check">✓</span> Alles van Free</li>
                    <li><span className="check">✓</span> Realtime trade alerts</li>
                    <li><span className="check">✓</span> Volledige redenering bij elke trade</li>
                    <li><span className="check">✓</span> Stop loss & take profit targets</li>
                    <li><span className="check">✓</span> Wekelijkse research reports</li>
                    <li><span className="check">✓</span> Prioriteit toegang community</li>
                  </ul>
                  <a className="btn btn-outline" target="_blank" rel="noopener noreferrer"
                    href={RESEARCH_WA}
                    style={{ width: '100%', justifyContent: 'center' }}>
                    Early access wachtlijst
                  </a>
                </div>
              </Reveal>
            </div>

            <p className="muted" style={{ marginTop: 28, fontSize: 12 }}>
              Pro tier is nog niet beschikbaar. Meld je aan voor de wachtlijst via WhatsApp.
            </p>
          </div>
        </section>

        {/* ── COMMUNITY ── */}
        <section className="section">
          <div className="wrap">
            <Reveal>
              <span className="eyebrow">Community</span>
              <h2 style={{ marginTop: 24, maxWidth: "22ch" }}>Word onderdeel van de community</h2>
              <p className="lede" style={{ marginTop: 18, maxWidth: '52ch' }}>
                Fynoy Capital groeit via mensen die serieus zijn over beleggen.
              </p>
            </Reveal>
            <div className="cta-split" style={{ marginTop: 48 }}>
              <Reveal className="cta-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <span className="eyebrow">Research community</span>
                  <h2 style={{ marginTop: 8 }}>Volg de research</h2>
                  <p>Lees analyses, woon pitches bij, stel vragen. Draag bij aan een groep die markten als vak ziet, niet als loterij.</p>
                </div>
                <div className="cta-foot">
                  <a className="btn btn-primary" target="_blank" rel="noopener noreferrer" href={RESEARCH_WA}>
                    {WA_ICON} Word lid via WhatsApp
                  </a>
                </div>
              </Reveal>
              <Reveal delay={100} className="cta-card gold" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <span className="eyebrow">Word analist</span>
                  <h2 style={{ marginTop: 8 }}>Schrijf je eigen research</h2>
                  <p>Schrijf research reports, presenteer stock pitches en bouw ervaring op in een echt investment team.</p>
                </div>
                <div className="cta-foot">
                  <a className="btn btn-on-gold" target="_blank" rel="noopener noreferrer" href={ANALYST_WA}>
                    {WA_ICON} Solliciteer via WhatsApp
                  </a>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── DISCLAIMER ── */}
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <p className="muted" style={{ fontSize: 12, maxWidth: '72ch', lineHeight: 1.7 }}>
              Fynoy Capital deelt informatie en analyses uitsluitend ter educatie en transparantie. Wij faciliteren
              geen automatisch handelen. Gebruikers plaatsen altijd zelf hun orders. Dit is geen beleggingsadvies.
              Rendementen uit het verleden bieden geen garantie voor de toekomst.
            </p>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
