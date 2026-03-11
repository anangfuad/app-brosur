import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "App-Brosur v2 - Search Dalil",
  description: "Mesin pencari dalil dan brosur Islam",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-[100dvh] flex flex-col bg-background text-foreground selection:bg-primary/20`}
      >
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
          <div className="container mx-auto px-4 h-14 flex items-center justify-between">
            <h1 className="text-lg font-bold text-primary flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-book-open-text"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/><path d="M6 8h2"/><path d="M6 12h2"/><path d="M16 8h2"/><path d="M16 12h2"/></svg>
              <span>App-Brosur<span className="text-foreground/70 text-sm ml-1 font-normal hidden sm:inline-block">v2</span></span>
            </h1>
          </div>
        </header>

        <main className="flex-1 flex flex-col container mx-auto px-4 py-6 w-full max-w-3xl">
          {children}
        </main>

        <footer className="border-t border-border mt-auto h-16 flex items-center justify-center bg-muted/30">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} App-Brosur. All rights reserved.
          </p>
        </footer>
      </body>
    </html>
  );
}
