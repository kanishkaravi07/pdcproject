import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kealvi — Live Community Q&A & Polls Platform",
  description: "Ask questions, share answers, run live polls, and build community reputation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AuthProvider>
          <Navbar />
          <div className="flex-1">{children}</div>
          <footer className="border-t border-border bg-surface py-6 text-center text-xs text-muted">
            <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p>© {new Date().getFullYear()} Kealvi Community Q&amp;A Platform. All rights reserved.</p>
              <div className="flex items-center gap-4">
                <span>Next.js 16</span>
                <span>•</span>
                <span>Supabase</span>
                <span>•</span>
                <span>Tailwind CSS</span>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
