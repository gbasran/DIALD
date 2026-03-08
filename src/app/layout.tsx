import type { Metadata } from "next";
import { Nunito, Nunito_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navigation } from "@/components/layout/Navigation";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DIALD",
  description: "Your ADHD-friendly academic companion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} ${nunitoSans.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <Providers>
          <div className="flex h-screen flex-col bg-background">
            {/* Top bar */}
            <header className="shrink-0 border-b border-border/40 bg-background/80 backdrop-blur-sm">
              <div className="flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-3">
                  <h1 className="font-heading text-lg font-bold text-primary">DIALD</h1>
                  <div className="hidden h-4 w-px bg-border/60 sm:block" />
                  <p className="hidden text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground/50 sm:block">
                    Academic Command Center
                  </p>
                </div>
                <ThemeToggle />
              </div>
            </header>

            {/* Content + Nav — fills remaining viewport */}
            <div className="flex min-h-0 flex-1">
              {/* Main content — scrollable only on mobile */}
              <main className="min-h-0 flex-1 overflow-y-auto p-3 pb-20 lg:pb-3">
                {children}
              </main>

              {/* Desktop nav panel */}
              <Navigation />
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
