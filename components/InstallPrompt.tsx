"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { links } from "@/lib/data";

// A versão permite reapresentar instruções melhoradas a quem fechou o aviso antigo.
const STORAGE_KEY = "zumba-do-cris-install-prompt-dismissed-v2";

type InstallChoice = {
  outcome: "accepted" | "dismissed";
  platform: string;
};

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallChoice>;
}

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
  const isModernIPad =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;

  if (/android/i.test(userAgent)) return "android";
  if (/iphone|ipad|ipod/i.test(userAgent) || isModernIPad) return "ios";
  return "other";
}

function isMobileDevice() {
  const isModernIPad =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  const mobileUserAgent = /android|iphone|ipad|ipod|mobile/i.test(
    navigator.userAgent
  );
  const smallTouchScreen = window.matchMedia(
    "(max-width: 820px) and (pointer: coarse)"
  ).matches;

  return mobileUserAgent || isModernIPad || smallTouchScreen;
}

export function InstallPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [platform, setPlatform] = useState<MobilePlatform>("other");

  useEffect(() => {
    // All browser-only checks stay inside the effect to avoid Next.js SSR errors.
    if (
      !isMobileDevice() ||
      isStandalone() ||
      localStorage.getItem(STORAGE_KEY) === "true"
    ) {
      return;
    }

    setPlatform(getMobilePlatform());

    const showTimer = window.setTimeout(() => setIsVisible(true), 900);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      localStorage.setItem(STORAGE_KEY, "true");
      localStorage.removeItem("zdc-notification-welcome-seen-v2");
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.clearTimeout(showTimer);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const dismissPrompt = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsVisible(false);
  };

  const installApp = async () => {
    if (!deferredPrompt) {
      setShowInstructions(true);
      return;
    }

    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;

      // Accepted or dismissed: do not interrupt this user again.
      localStorage.setItem(STORAGE_KEY, "true");
      setDeferredPrompt(null);
      setIsVisible(false);
    } catch {
      // If the native prompt fails, keep the user moving with manual steps.
      setDeferredPrompt(null);
      setShowInstructions(true);
    }
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
              Tenha o app por perto
            </p>
            <h2
              className="mt-1 text-2xl font-black leading-tight text-cris-navy"
              id="install-prompt-title"
            >
              Adicione o Zumba do Cris à sua tela inicial 💖
            </h2>
          </div>
        </div>

        <p className="mt-4 text-base font-bold leading-relaxed text-cris-navy/75">
          Tenha acesso rápido às turmas, horários, planos e novidades direto do
          seu celular.
        </p>

        {showInstructions ? (
          <div className="mt-4 rounded-lg bg-cris-paper p-4 ring-1 ring-cris-navy/10">
            <p className="text-sm font-black uppercase text-cris-pink">
              Instalação manual
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
                  <li>1. Toque no botão Compartilhar.</li>
                  <li>2. Escolha “Adicionar à Tela de Início”.</li>
                  <li>3. Confirme.</li>
                </ol>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 grid gap-3">
          <button
            className="min-h-14 rounded-lg bg-cris-pink px-5 py-3 text-base font-black uppercase text-white shadow-[0_12px_28px_rgba(242,7,114,0.28)] transition active:scale-[0.98]"
            onClick={installApp}
            type="button"
          >
            📲 Instalar app
          </button>
          <button
            className="min-h-12 rounded-lg px-5 py-3 text-sm font-black uppercase text-cris-navy transition hover:bg-cris-navy/5"
            onClick={dismissPrompt}
            type="button"
          >
            Agora não
          </button>
        </div>
      </section>
    </div>
  );
}
