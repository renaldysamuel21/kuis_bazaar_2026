import type { Metadata, Viewport } from "next";

import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

import "./globals.css";

export const metadata: Metadata = {
  title: "Kuis Bazaar 2026",
  description: "Permainan kuis Alkitab untuk Bazaar Sekolah Minggu 2026.",
  applicationName: "Kuis Bazaar 2026",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kuis Bazaar",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#f8b8ce",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
