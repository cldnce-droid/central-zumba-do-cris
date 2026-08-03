"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { links } from "@/lib/data";

const INSTALLED_KEY = "zumba-do-cris-install-manual-complete-v1";
const LATER_KEY = "zumba-do-cris-install-manual-later-v1";

type MobilePlatform = "android" | "ios" | "other";

function isStandalone() {
  const iosNavigator = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    iosNavigator.standalone === true
  );
}

function getMobilePlatform(): MobilePlatform {
  const userAgent = navigator.userAgent;
  const modernIPad =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;

  if (/android/i.test(userAgent)) return "android";
  if (/iphone|ipad|ipod/i.test(userAgent) || modernIPad) return "ios";
  return "other";
}

function isMobileDevice() {
  const modernIPad =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return (
    /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent) ||
    modernIPad ||
    window.matchMedia("(max-width: 820px) and (pointer: coarse)").matches
  );
}

export function InstallPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [platform, setPlatform] = useState<MobilePlatform>("other");

  useEffect(() => {
    if (
      !isMobileDevice() ||
      isStandalone() ||
      localStorage.getItem(INSTALLED_KEY) === "true" ||
      sessionStorage.getItem(LATER_KEY) === "true"
    ) {
      return;
    }

    setPlatform(getMobilePlatform());
    const timer = window.setTimeout(() => setIsVisible(true), 900);
    return () => window.clearTimeout(timer);
  }, []);

  const markAsInstalled = () => {
    localStorage.setItem(INSTALLED_KEY, "true");
    setIsVisible(false);
  };

  const downloadLater = () => {
    // Não volta a incomodar durante esta navegação, mas pode aparecer em outra visita.
    sessionStorage.setItem(LATER_KEY, "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-cris-navy/70 p-3 backdrop-blur-sm"
      role="presentation"
    >
      <section
        aria-labelledby="install-prompt-title"
        aria-modal="true"
        className="relative mx-auto w-full max-w-md overflow-hidden rounded-lg border border-white/50 bg-white p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-[0_24px_80px_rgba(7,16,70,0.4)]"
        role="dialog"
      >
        <div
          aria-hidden="true"
          className="paint-stroke absolute -right-8 top-5 h-8 w-36 bg-cris-pink"
        />

        <div className="relative flex items-start gap-4">
          <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-lg border border-cris-navy/10 bg-white">
            <Image
              alt="Logo oficial Zumba do Cris"
              className="h-full w-full scale-[1.7] object-contain"
              height={160}
              src={links.officialLogo}
              width={160}
            />
          </div>
          <div className="min-w-0 pt-1">
            <p className="text-xs font-black uppercase text-cris-blue">
              Instalação opcional
            </p>
            <h2
              className="mt-1 text-2xl font-black leading-tight text-cris-navy"
              id="install-prompt-title"
            >
              Coloque o Zumba do Cris na tela inicial 💖
            </h2>
          </div>
        </div>

        <p className="mt-4 text-base font-bold leading-relaxed text-cris-navy/75">
          A instalação é manual e opcional. Você pode continuar usando a Central
          normalmente pelo navegador.
        </p>

        <div className="mt-4 rounded-lg border-2 border-cris-yellow bg-cris-paper p-4 shadow-[0_10px_28px_rgba(7,16,70,0.08)]">
          <p className="text-sm font-black uppercase text-cris-pink">
            Como instalar
          </p>

          {platform !== "ios" ? (
            <div className="mt-3">
              <p className="font-black text-cris-navy">Android / Chrome</p>
              <ol className="mt-2 space-y-1 text-sm font-bold leading-relaxed text-cris-navy/75">
                <li>1. Toque nos três pontinhos do navegador.</li>
                <li>2. Escolha “Adicionar à tela inicial”.</li>
                <li>3. Confirme.</li>
              </ol>
            </div>
          ) : null}

          {platform !== "android" ? (
            <div className={platform === "other" ? "mt-4" : "mt-3"}>
              <p className="font-black text-cris-navy">iPhone / Safari</p>
              <ol className="mt-2 space-y-1 text-sm font-bold leading-relaxed text-cris-navy/75">
                <li>1. Abra esta página pelo Safari.</li>
                <li>2. Toque no botão Compartilhar.</li>
                <li>3. Escolha “Adicionar à Tela de Início”.</li>
                <li>4. Confirme em “Adicionar”.</li>
              </ol>
            </div>
          ) : null}
        </div>

        <div className="mt-5 grid gap-3">
          <button
            className="min-h-14 rounded-lg bg-cris-pink px-5 py-3 text-base font-black uppercase text-white shadow-[0_12px_28px_rgba(242,7,114,0.28)] transition active:scale-[0.98]"
            onClick={markAsInstalled}
            type="button"
          >
            Já adicionei à tela inicial
          </button>
          <button
            className="min-h-12 rounded-lg px-5 py-3 text-sm font-black uppercase text-cris-navy transition hover:bg-cris-navy/5"
            onClick={downloadLater}
            type="button"
          >
            Baixar depois
          </button>
        </div>
      </section>
    </div>
  );
}
