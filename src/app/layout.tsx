import "./globals.css";
import type { Metadata } from "next";
import React from "react";
import { ThemeProvider, ThemeLayers } from "@/context/ThemeContext";
import { Rubik, Noto_Sans_KR, Noto_Sans_JP, Noto_Sans_SC, Noto_Sans_TC } from 'next/font/google';

const nunito = Rubik({
  subsets: ['latin'],
  weight: ['400','500','700'],
  variable: '--font-nunito',
});
const notoKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-noto-kr',
});
const notoJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-noto-jp',
});
const notoSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-noto-sc',
});
const notoTC = Noto_Sans_TC({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-noto-tc',
});

export const metadata: Metadata = {
  title: "rtcl — Top stories",
  description: "read rtcl, ctrl language",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`h-full bg-transparent ${nunito.variable} ${notoKR.variable} ${notoJP.variable} ${notoSC.variable} ${notoTC.variable} ${nunito.className}`}
    >
      <body className="min-h-screen bg-transparent text-neutral-900 antialiased">
        <ThemeProvider>
          {/* Mount the selected theme (none by default) */}
          <ThemeLayers />
          <main className="font-sans relative z-10">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}