import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://fynoy.com"),
  title: {
    default: "Fynoy Capital — Independent equity research & investment",
    template: "%s — Fynoy Capital",
  },
  description:
    "Fynoy Capital is an independent, research-led investment practice based in Rotterdam. Weekly stock pitches, a serious investor community, and long-only conviction.",
  openGraph: {
    siteName: "Fynoy Capital",
    locale: "en_GB",
    type: "website",
  },
  icons: { icon: "/favicon.png" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
