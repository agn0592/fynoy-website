import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { WA_ICON } from "../components/WaIcon";
import Reveal from "../components/Reveal";
import HeroOrbs from "../components/HeroOrbs";
import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY, CONTACT_PHONE_E164, WA_GENERAL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Fynoy Capital. Questions, press, or general enquiries — reach us via WhatsApp or email. Based in Rotterdam, Netherlands.",
};

export default function ContactPage() {
  return (
    <>
      <Nav />
      <main>

        {/* ── HERO ── */}
        <header className="hero">
          <div className="grid-bg" />
          <HeroOrbs />
          <div className="wrap" style={{ position: "relative", zIndex: 1 }}>
            <span className="eyebrow" style={{ animation: "fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both" }}>Contact</span>
            <h1 style={{ animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both", animationDelay: "0.1s" }}>
              Get in <em className="it">touch.</em>
            </h1>
            <p className="hero-sub lede" style={{ animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both", animationDelay: "0.25s" }}>
              Questions, press, or general enquiries — we read every message.
            </p>
          </div>
        </header>

        {/* ── CONTACT GRID ── */}
        <section className="section">
          <div className="wrap">
            <div className="contact-grid">
              <Reveal>
                <div className="contact-info">
                  <span className="eyebrow">Office</span>
                  <div style={{ marginTop: 24 }}>
                    {[
                      { label: "Location", main: "Rotterdam", sub: "Netherlands" },
                      { label: "Registration", main: "KvK 86136062", sub: null },
                      { label: "Email", main: null, link: { href: `mailto:${CONTACT_EMAIL}`, text: CONTACT_EMAIL } },
                      { label: "WhatsApp", main: null, link: { href: `https://wa.me/${CONTACT_PHONE_E164}`, text: CONTACT_PHONE_DISPLAY, external: true } },
                    ].map((row, i) => (
                      <div key={i} className="info-row">
                        <span className="label">{row.label}</span>
                        <div>
                          {row.main && <b>{row.main}</b>}
                          {row.sub && <><br /><span className="muted">{row.sub}</span></>}
                          {row.link && (
                            <a
                              href={row.link.href}
                              target={row.link.external ? "_blank" : undefined}
                              rel={row.link.external ? "noopener noreferrer" : undefined}
                              style={{ color: "var(--gold)" }}
                            >
                              {row.link.text}
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
              <Reveal delay={120}>
                <div className="contact-cta">
                  <span className="eyebrow">WhatsApp</span>
                  <h2 style={{ marginTop: 8 }}>Reach us on WhatsApp</h2>
                  <p className="muted" style={{ maxWidth: "36ch" }}>The fastest way to get in touch. Messages are read directly by the team.</p>
                  <div>
                    <a className="btn btn-primary" target="_blank" rel="noopener noreferrer"
                      href={WA_GENERAL}>
                      {WA_ICON} Message us on WhatsApp
                    </a>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
