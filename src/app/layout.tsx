import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider, themeScript } from "@/contexts/theme-context";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });

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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
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
