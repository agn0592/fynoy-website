import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Reveal from "../components/Reveal";
import HeroOrbs from "../components/HeroOrbs";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Install Fynoy as an app",
  description:
    "Install Fynoy Capital as an app on iPhone, Android or desktop. No App Store — directly from your browser.",
};

interface Step { n: string; title: string; body: string }

const IOS_STEPS: Step[] = [
  { n: "1", title: "Open fynoy.com in Safari", body: "Installation only works in Safari on iOS. Other browsers won't show the option." },
  { n: "2", title: "Tap the Share icon", body: "The square-with-up-arrow icon at the bottom of the screen (or top right on iPad)." },
  { n: "3", title: "Choose 'Add to Home Screen'", body: "Scroll down in the share sheet until you see it." },
  { n: "4", title: "Tap 'Add'", body: "The Fynoy Capital app appears on your home screen. No App Store needed." },
]

const ANDROID_STEPS: Step[] = [
  { n: "1", title: "Open fynoy.com in Chrome", body: "On Android the installation flow works through Chrome or another Chromium browser." },
  { n: "2", title: "Tap the three-dot menu", body: "Top right corner — opens the Chrome menu." },
  { n: "3", title: "Choose 'Add to Home Screen'", body: "Or 'Install app' if that option appears." },
  { n: "4", title: "Tap 'Add'", body: "Confirm and the app shows up on your home screen." },
]

const DESKTOP_STEPS: Step[] = [
  { n: "1", title: "Open fynoy.com in Chrome or Edge", body: "Works in any Chromium-based browser including Brave." },
  { n: "2", title: "Click the install icon in the URL bar", body: "A small screen-with-arrow icon on the right side of the address bar." },
  { n: "3", title: "Click 'Install'", body: "The app opens in its own window, separate from the browser." },
]

const BENEFITS = [
  "Own icon on your home screen",
  "Full screen — no browser chrome",
  "No App Store, no review",
  "Works offline (limited) and updates itself",
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
            <span className="eyebrow">Install as an app</span>
            <h1 style={{ marginTop: 24, maxWidth: '18ch' }}>
              Fynoy Capital on your <em className="it">phone.</em>
            </h1>
            <p className="hero-sub lede">
              No App Store download. Install Fynoy Capital straight from your browser
              on iPhone, Android or desktop — as a full app.
            </p>
            <div className="hero-cta">
              <Link className="btn btn-primary" href="/">
                Open fynoy.com
              </Link>
              <Link className="btn btn-outline" href="/dashboard">
                To the dashboard
              </Link>
            </div>
          </div>
        </header>

        {/* iPhone */}
        <section className="section">
          <div className="wrap">
            <Reveal>
              <span className="eyebrow">iPhone (Safari)</span>
              <h2 style={{ marginTop: 24, maxWidth: '20ch' }}>Install on iOS</h2>
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
              <h2 style={{ marginTop: 24, maxWidth: '20ch' }}>Install on Android</h2>
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
              <h2 style={{ marginTop: 24, maxWidth: '20ch' }}>Install on desktop</h2>
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
              <span className="eyebrow">Benefits</span>
              <h2 style={{ marginTop: 24, maxWidth: '18ch' }}>Why install?</h2>
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
