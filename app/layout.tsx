import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { QueryProvider } from "@/components/QueryProvider";
import Navbar from "@/components/Navbar";
import AppBackground from "@/components/AppBackground";

const SITE_NAME = "Himal XI";
const SITE_URL = "https://himalxi.vercel.app";
const SITE_TITLE = "Himal XI — Fantasy Premier League Dashboard";
const SITE_DESCRIPTION =
  "Track live FPL points, mini-league standings, and team stats in real time. Search any manager or league and follow gameweek scores as they happen.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | Himal XI",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "Fantasy Premier League",
    "FPL",
    "FPL live scores",
    "FPL league standings",
    "FPL team stats",
    "fantasy football",
    "FPL rank tracker",
  ],
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "en_US",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: SITE_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  manifest: "/manifest.webmanifest",
  category: "sports",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f0f0f0" },
    { media: "(prefers-color-scheme: dark)", color: "#080810" },
  ],
  colorScheme: "dark light",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  applicationCategory: "SportsApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* Applies the theme class before hydration, so the correct theme is
            visible from the first paint instead of flashing in after mount.
            Safari is locked to dark — see ThemeProvider for why. */}
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var ua=navigator.userAgent;var isSafari=/^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(ua);if(isSafari){document.documentElement.classList.add('dark');return;}var t=localStorage.getItem('fpl-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <QueryProvider>
          <ThemeProvider>
            <AppBackground />
            <Navbar />
            <main className="relative z-1">{children}</main>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
