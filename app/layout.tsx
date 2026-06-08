import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Header } from "@/components/Header";
import { PwaRegister } from "@/components/PwaRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: "Central Zumba do Cris",
  description: "Central mobile para alunos do Zumba do Cris.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Zumba do Cris",
    statusBarStyle: "default"
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg"
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
