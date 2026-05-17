"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Home", key: "home" },
  { href: "/about", label: "About", key: "about" },
  { href: "/join", label: "Join Us", key: "join" },
  { href: "/work-with-us", label: "Work With Us", key: "work" },
  { href: "/contact", label: "Contact", key: "contact" },
];

const LOGO_SVG = (
  <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6"  y="32" width="6" height="20" fill="#c9a96e" opacity=".55"/>
    <rect x="16" y="24" width="6" height="28" fill="#c9a96e" opacity=".7"/>
    <rect x="26" y="14" width="6" height="38" fill="#c9a96e" opacity=".85"/>
    <rect x="36" y="6"  width="6" height="46" fill="#c9a96e"/>
    <path d="M8 40 L42 12" stroke="#c9a96e" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M37 8 L42 12 L40 18" stroke="#c9a96e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

function getPageKey(pathname: string): string {
  if (pathname === "/" || pathname === "") return "home";
  if (pathname.startsWith("/about")) return "about";
  if (pathname.startsWith("/join")) return "join";
  if (pathname.startsWith("/work-with-us")) return "work";
  if (pathname.startsWith("/contact")) return "contact";
  return "";
}

export default function Nav() {
  const pathname = usePathname();
  const pageKey = getPageKey(pathname);
  const drawerRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);

  function toggleDrawer() {
    const d = drawerRef.current;
    const b = burgerRef.current;
    if (!d || !b) return;
    const open = d.classList.toggle("is-open");
    b.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function closeDrawer() {
    drawerRef.current?.classList.remove("is-open");
    burgerRef.current?.setAttribute("aria-expanded", "false");
  }

  // Close drawer on route change
  useEffect(() => { closeDrawer(); }, [pathname]);

  return (
    <nav className="nav" aria-label="Primary">
      <div className="nav-inner">
        <Link href="/" className="brand">
          <span className="brand-mark" aria-hidden="true">{LOGO_SVG}</span>
          <span className="brand-name"><b>Fynoy</b><i>Capital</i></span>
        </Link>
        <div className="nav-links">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.key}
              href={l.href}
              className={`nav-link${pageKey === l.key ? " is-active" : ""}`}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="nav-cta-group">
          <Link href="/auth/login" className="nav-cta-ghost">
            Login
          </Link>
          <Link href="/auth/register" className="nav-cta-primary">
            Free account
          </Link>
        </div>
        <button
          ref={burgerRef}
          className="nav-burger"
          id="nav-burger"
          aria-label="Open menu"
          aria-expanded="false"
          onClick={toggleDrawer}
        >
          <span />
        </button>
      </div>
      <div ref={drawerRef} className="nav-drawer" id="nav-drawer">
        {NAV_LINKS.map((l) => (
          <Link key={l.key} href={l.href} onClick={closeDrawer}>
            {l.label}
          </Link>
        ))}
        <Link href="/auth/login" onClick={closeDrawer} className="nav-drawer-login">
          Login
        </Link>
        <Link href="/auth/register" onClick={closeDrawer} className="nav-drawer-login" style={{ color: 'var(--gold)' }}>
          Free account →
        </Link>
      </div>
    </nav>
  );
}
