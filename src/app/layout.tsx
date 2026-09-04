import type { Metadata, Viewport } from "next";
import { Averia_Serif_Libre, Inter } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider, themeScript } from "@/contexts/theme-context";
import "./globals.css";

/**
 * Two families with distinct jobs:
 *
 *  - Inter runs the entire interface. It was drawn for screens at 13–17px,
 *    which is the whole range this UI lives in.
 *  - Averia Serif Libre is the brand's single flourish — event titles and
 *    hero words. Its slightly irregular, hand-cut letterforms are what stop
 *    the product reading as another neutral dashboard. It is never used for
 *    UI text, where that same irregularity would be noise.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
});

const averia = Averia_Serif_Libre({
  variable: "--font-averia",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

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
    /*
      The font variables must live on <html>, not <body>: `--font-sans` and
      `--font-serif` are declared on `:root` and reference them, and a custom
      property is substituted on the element that declares it. Declared one
      level lower, `var(--font-inter)` is undefined at `:root` and both theme
      fonts collapse to the system fallback.
    */
    <html lang="en" className={`${inter.variable} ${averia.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
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
