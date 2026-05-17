import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaInit from "@/app/components/PwaInit";
import InstallPrompt from "@/app/components/InstallPrompt";

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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Fynoy Capital",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: "/fynoy-square.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0f1e",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Static manifest — ensures browsers pick up start_url=/dashboard */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&display=swap"
        />
      </head>
      <body>
        {children}
        <PwaInit />
        <InstallPrompt />
      </body>
    </html>
  );
}
