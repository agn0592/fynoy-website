import { Suspense } from "react";
import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import LegalContent from "./LegalContent";

export const metadata: Metadata = {
  title: "Legal",
  description:
    "Privacy Policy, Terms & Conditions, Cookie Policy, and Disclaimer for Fynoy Capital.",
};

export default function LegalPage() {
  return (
    <>
      <Nav />
      <main>
        <header className="hero" style={{ paddingBottom: 24 }}>
          <div className="wrap">
            <span className="eyebrow">Legal</span>
            <h1 style={{ fontSize: "clamp(36px,4.5vw,60px)" }}>
              Policies &amp; <em className="it">disclosures.</em>
            </h1>
            <p className="hero-sub lede">
              All policies governing the use of fynoy.com and the services described herein.
            </p>
          </div>
        </header>
        <Suspense fallback={<div style={{ padding: "80px var(--pad-x)" }} />}>
          <LegalContent />
        </Suspense>
        <div style={{ height: 96 }} />
      </main>
      <Footer />
    </>
  );
}
