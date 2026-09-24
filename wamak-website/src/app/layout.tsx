import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import { JsonLd } from "@/components/brand/JsonLd";
import { site } from "@/content/site";
import { organizationSchema, siteUrl } from "@/lib/schema";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  // Canonical and Open Graph URLs resolve against NEXT_PUBLIC_SITE_URL (domain pending).
  metadataBase: new URL(siteUrl),
  applicationName: site.name,
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_GB",
  },
  twitter: { card: "summary_large_image" },
  title: {
    default: `${site.name} — ${site.brandLine}`,
    template: `%s | ${site.name}`,
  },
  description:
    "WAMAK GROUP is a Dhaka-based exporter and sourcing partner connecting international B2B buyers with jute, natural fibre, handicraft, home décor, agricultural, seafood and artwork suppliers in Bangladesh.",
};

export const viewport: Viewport = {
  themeColor: "#05245C",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" dir="ltr" className={`${manrope.variable} ${inter.variable}`}>
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-navy-900 focus:px-4 focus:py-3 focus:text-ivory-50"
        >
          Skip to content
        </a>
        {children}
        <JsonLd data={organizationSchema()} />
        {/* Analytics load only when a GA4 ID is configured (see docs/analytics-events.md). */}
        {process.env.NEXT_PUBLIC_GA_ID && <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />}
      </body>
    </html>
  );
}
