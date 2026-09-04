import type { Metadata, Viewport } from "next";
import { Geist_Mono, Instrument_Sans, Inter } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider, themeScript } from "@/contexts/theme-context";
import "./globals.css";

/**
 * Two families with distinct jobs, which is what gives the interface a voice:
 *
 *  - Inter runs the UI. It was drawn for screens at 12–16px, so labels, table
 *    cells and form text stay crisp at sizes where a display face smears.
 *  - Instrument Sans runs headlines only. It is narrower and higher-contrast
 *    than Inter, so a title reads as a deliberate typographic act rather than
 *    as body copy that happens to be large.
 *
 * Both are variable, so one file covers every weight we use.
 */
const sans = Inter({
  variable: "--font-sans-family",
  subsets: ["latin"],
  display: "swap",
  // Optical sizing: Inter subtly reshapes itself for small vs large text.
  axes: ["opsz"],
});

const display = Instrument_Sans({
  variable: "--font-display-family",
  subsets: ["latin"],
  display: "swap",
});

const mono = Geist_Mono({ variable: "--font-mono-family", subsets: ["latin"], display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Tazkarti — Find your next night out",
    template: "%s · Tazkarti",
  },
  description:
    "Tazkarti is a modern ticketing platform: discover concerts, theatre, conferences and festivals, buy in seconds, and manage your own events with real-time sales and check-in.",
  keywords: ["tickets", "events", "concerts", "theatre", "festivals", "ticketing", "Cairo"],
  openGraph: {
    type: "website",
    siteName: "Tazkarti",
    title: "Tazkarti — Find your next night out",
    description: "Discover and book events. Sell tickets with real-time sales and check-in.",
    url: siteUrl,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1f" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${sans.variable} ${display.variable} ${mono.variable} antialiased`}>
        <ThemeProvider>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              classNames: {
                toast:
                  "!bg-surface !text-ink !border-border !rounded-xl !shadow-lift !font-sans",
                description: "!text-ink-muted",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
