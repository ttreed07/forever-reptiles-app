import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ForeverReptiles Tracker",
  description: "Cloud Husbandry & Collection Tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen pb-24 font-sans select-none antialiased">
        {children}
      </body>
    </html>
  );
}