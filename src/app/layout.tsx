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
          <div className="min-h-screen bg-background">
            <header className="mx-auto flex max-w-4xl items-center justify-between px-4 pt-4">
              <h1 className="font-heading text-lg font-bold text-primary">DIALD</h1>
              <ThemeToggle />
            </header>
            <main className="mx-auto max-w-4xl px-4 pb-20 pt-6">
              {children}
            </main>
            <Navigation />
          </div>
        </Providers>
      </body>
    </html>
  );
}
