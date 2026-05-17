import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Reveal from "../components/Reveal";
import HeroOrbs from "../components/HeroOrbs";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Fynoy als app",
  description:
    "Installeer Fynoy Capital als app op iPhone, Android of desktop. Geen App Store nodig — direct via je browser.",
};

interface Step { n: string; title: string; body: string }

const IOS_STEPS: Step[] = [
  { n: "1", title: "Open fynoy.com in Safari", body: "De installatie werkt alleen via Safari op iOS. Andere browsers tonen de optie niet." },
  { n: "2", title: "Tik op het Delen-icoon", body: "Het vierkant met pijltje omhoog, onderaan je scherm (of rechtsboven op iPad)." },
  { n: "3", title: "Kies 'Zet op beginscherm'", body: "Scroll het deelmenu naar beneden tot je deze optie ziet." },
  { n: "4", title: "Tik 'Voeg toe'", body: "De Fynoy Capital app verschijnt op je beginscherm. Geen App Store nodig." },
]

const ANDROID_STEPS: Step[] = [
  { n: "1", title: "Open fynoy.com in Chrome", body: "Op Android werkt de installatie via Chrome of een andere Chromium-browser." },
  { n: "2", title: "Tik de drie puntjes rechtsboven", body: "Het Chrome-menu opent zich." },
  { n: "3", title: "Kies 'Toevoegen aan startscherm'", body: "Of 'App installeren' als die optie verschijnt." },
  { n: "4", title: "Tik 'Toevoegen'", body: "Bevestig en de app verschijnt op je startscherm." },
]

const DESKTOP_STEPS: Step[] = [
  { n: "1", title: "Open fynoy.com in Chrome of Edge", body: "Werkt ook in andere Chromium-browsers zoals Brave." },
  { n: "2", title: "Klik het installeer-icoon in de adresbalk", body: "Een klein scherm-icoon met pijltje aan de rechterkant van de URL." },
  { n: "3", title: "Klik 'Installeren'", body: "De app opent in een eigen venster, los van de browser." },
]

const BENEFITS = [
  "Eigen icoon op je beginscherm",
  "Volledig scherm — geen browser balken",
  "Geen App Store, geen review",
  "Werkt offline (beperkt) en update zichzelf",
]

function StepCard({ step }: { step: Step }) {
  return (
    <div className="step">
      <div className="step-num">{step.n}</div>
      <h4>{step.title}</h4>
      <p>{step.body}</p>
    </div>
  )
}

export default function DownloadAppPage() {
  return (
    <>
      <Nav />
      <main>

        <header className="hero">
          <div className="grid-bg" />
          <HeroOrbs />
          <div className="wrap" style={{ position: "relative", zIndex: 1 }}>
            <span className="eyebrow">Installeer als app</span>
            <h1 style={{ marginTop: 24, maxWidth: '18ch' }}>
              Fynoy Capital op je <em className="it">telefoon.</em>
            </h1>
            <p className="hero-sub lede">
              Geen download via de App Store. Installeer Fynoy Capital direct vanuit je browser
              op iPhone, Android of desktop — als volledige app.
            </p>
            <div className="hero-cta">
              <Link className="btn btn-primary" href="/">
                Open fynoy.com
              </Link>
              <Link className="btn btn-outline" href="/dashboard">
                Naar dashboard
              </Link>
            </div>
          </div>
        </header>

        {/* iPhone */}
        <section className="section">
          <div className="wrap">
            <Reveal>
              <span className="eyebrow">iPhone (Safari)</span>
              <h2 style={{ marginTop: 24, maxWidth: '20ch' }}>Installeer op iOS</h2>
            </Reveal>
            <div className="steps" style={{ marginTop: 48 }}>
              {IOS_STEPS.map((s, i) => (
                <Reveal key={s.n} delay={i * 80}><StepCard step={s} /></Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Android */}
        <section className="section">
          <div className="wrap">
            <Reveal>
              <span className="eyebrow">Android (Chrome)</span>
              <h2 style={{ marginTop: 24, maxWidth: '20ch' }}>Installeer op Android</h2>
            </Reveal>
            <div className="steps" style={{ marginTop: 48 }}>
              {ANDROID_STEPS.map((s, i) => (
                <Reveal key={s.n} delay={i * 80}><StepCard step={s} /></Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Desktop */}
        <section className="section">
          <div className="wrap">
            <Reveal>
              <span className="eyebrow">Desktop (Chrome / Edge)</span>
              <h2 style={{ marginTop: 24, maxWidth: '20ch' }}>Installeer op desktop</h2>
            </Reveal>
            <div className="steps" style={{ marginTop: 48, gridTemplateColumns: 'repeat(3,1fr)' }}>
              {DESKTOP_STEPS.map((s, i) => (
                <Reveal key={s.n} delay={i * 80}><StepCard step={s} /></Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="section">
          <div className="wrap">
            <Reveal>
              <span className="eyebrow">Voordelen</span>
              <h2 style={{ marginTop: 24, maxWidth: '18ch' }}>Waarom installeren?</h2>
            </Reveal>
            <div className="check-grid" style={{ marginTop: 48 }}>
              {BENEFITS.map((b, i) => (
                <Reveal key={b} delay={i * 80}>
                  <div className="check">
                    <div className="check-circle">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8 L7 12 L13 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <h3 style={{ fontSize: 18 }}>{b}</h3>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
