import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Plus_Jakarta_Sans,
  Geist_Mono,
} from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { MarketingPixels } from "@/components/analytics/MarketingPixels";
import { getAppUrl } from "@/lib/app-url";
import "./globals.css";

const cormorantSerif = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getAppUrl()),
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "OL. Indumenti",
  },
  twitter: { card: "summary_large_image" },
  title: {
    default: "OL. | Neutral State — FW'26 | OL Indumenti",
    template: "%s | OL. Indumenti",
  },
  description:
    "OL Indumenti — Sastrería contemporánea, denim y esenciales de diseño en tonos neutros. Buenos Aires, Argentina.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-AR"
      className={`${cormorantSerif.variable} ${jakartaSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white font-sans text-stone-900 selection:bg-stone-900 selection:text-stone-50">
        {children}
        <Analytics />
        <SpeedInsights />
        <MarketingPixels />
      </body>
    </html>
  );
}
