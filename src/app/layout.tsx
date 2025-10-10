import "./globals.css";

export const metadata = {
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
        <main className="font-sans">{children}</main>
      </body>
    </html>
  );
}