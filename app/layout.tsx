import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Çalışma Takip Paneli",
  description: "Günlük çalışma ve deneme performansı takip uygulaması"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
