import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { WA_ICON } from "../components/WaIcon";

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
          <div className="wrap" style={{ position: "relative" }}>
            <span className="eyebrow">Contact</span>
            <h1>Get in <em className="it">touch.</em></h1>
            <p className="hero-sub lede">Questions, press, or general enquiries — we read every message.</p>
          </div>
        </header>

        {/* ── CONTACT GRID ── */}
        <section className="section">
          <div className="wrap">
            <div className="contact-grid">
              <div className="contact-info">
                <span className="eyebrow">Office</span>
                <div style={{ marginTop: 24 }}>
                  <div className="info-row">
                    <span className="label">Location</span>
                    <div><b>Rotterdam</b><br /><span className="muted">Netherlands</span></div>
                  </div>
                  <div className="info-row">
                    <span className="label">Registration</span>
                    <div><b>KvK 86136062</b></div>
                  </div>
                  <div className="info-row">
                    <span className="label">Email</span>
                    <div><a href="mailto:fynoycapital@gmail.com" style={{ color: "var(--gold)" }}>fynoycapital@gmail.com</a></div>
                  </div>
                  <div className="info-row">
                    <span className="label">WhatsApp</span>
                    <div><a href="https://wa.me/31682074482" target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)" }}>+31 6 82074482</a></div>
                  </div>
                </div>
              </div>
              <div className="contact-cta">
                <span className="eyebrow">WhatsApp</span>
                <h2 style={{ marginTop: 8 }}>Reach us on WhatsApp</h2>
                <p className="muted" style={{ maxWidth: "36ch" }}>The fastest way to get in touch. Messages are read directly by the team.</p>
                <div>
                  <a className="btn btn-primary" target="_blank" rel="noopener noreferrer"
                    href="https://wa.me/31682074482?text=Hi%2C%20I%20have%20a%20question%20about%20Fynoy%20Capital.">
                    {WA_ICON} Message us on WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
