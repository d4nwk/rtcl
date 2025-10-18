import "./globals.css";
import Backdrop from "@/components/Backdrop";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "rtcl — Top stories",
  description: "read rtcl, ctrl language",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-white text-neutral-900 antialiased">
        <Backdrop />
        <main className="font-sans relative z-10">{children}</main>
      </body>
    </html>
  );
}