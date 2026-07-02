import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Header } from "@/components/Header";
import { NotificationOptIn } from "@/components/NotificationOptIn";
import { OneSignalInitializer } from "@/components/OneSignalInitializer";
import { PwaRegister } from "@/components/PwaRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: "Central Zumba do Cris",
  description: "Central mobile para alunos do Zumba do Cris.",
  manifest: "/manifest.webmanifest?v=20260609",
  appleWebApp: {
    capable: true,
    title: "Zumba do Cris",
    statusBarStyle: "default"
  },
  icons: {
    icon: [
      {
        url: "/icons/favicon.ico?v=20260609",
        sizes: "any",
        type: "image/x-icon"
      },
      {
        url: "/icons/icon-192.png?v=20260609",
        sizes: "192x192",
        type: "image/png"
      },
      {
        url: "/icons/icon-512.png?v=20260609",
        sizes: "512x512",
        type: "image/png"
      }
    ],
    shortcut: "/icons/favicon.ico?v=20260609",
    apple: [
      {
        url: "/icons/apple-touch-icon.png?v=20260609",
        sizes: "180x180",
        type: "image/png"
      }
    ]
  }
};

export const viewport: Viewport = {
  themeColor: "#071046",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <PwaRegister />
        <OneSignalInitializer />
        <NotificationOptIn />
        <div className="min-h-dvh overflow-hidden bg-cris-paper text-cris-navy">
          <div className="app-bg" aria-hidden="true" />
          <Header />
          <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-col px-4 pb-28 pt-5 md:px-5 md:pb-12 md:pt-3">
            {children}
          </main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
