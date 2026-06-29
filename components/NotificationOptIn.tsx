"use client";

import { useEffect, useState } from "react";

type NotificationStatus =
  | "loading"
  | "idle"
  | "success"
  | "denied"
  | "unsupported"
  | "not-configured"
  | "failed";

interface OneSignalClient {
  init(options: Record<string, unknown>): Promise<void>;
  Notifications: {
    permission: boolean;
    requestPermission(): Promise<void>;
  };
}

declare global {
  interface Window {
    OneSignalDeferred?: Array<
      (oneSignal: OneSignalClient) => void | Promise<void>
    >;
  }
}

const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const WELCOME_KEY = "zdc-notification-welcome-seen-v2";
const SYNC_KEY = "zdc-onesignal-sync-pending";

const messages: Partial<Record<NotificationStatus, string>> = {
  success: "Notificacoes ativadas com sucesso!",
  denied: "Tudo bem! Voce ainda pode acompanhar os avisos por aqui.",
  unsupported: "Seu navegador ainda nao permite notificacoes.",
  "not-configured": "As notificacoes ainda nao foram configuradas.",
  failed: "Nao foi possivel ativar agora. Tente novamente."
};

export function NotificationOptIn() {
  const [isVisible, setIsVisible] = useState(false);
  const [status, setStatus] = useState<NotificationStatus>("idle");
  const [oneSignal, setOneSignal] = useState<OneSignalClient | null>(null);
  const [errorDetail, setErrorDetail] = useState("");

  useEffect(() => {
    const iosNavigator = navigator as Navigator & { standalone?: boolean };
    const installed =
      window.matchMedia("(display-mode: standalone)").matches ||
      iosNavigator.standalone === true;

    if (
      installed &&
      appId &&
      "Notification" in window &&
      Notification.permission === "granted" &&
      localStorage.getItem(SYNC_KEY) === "true"
    ) {
      window.setTimeout(() => {
        loadOneSignal()
          .then(() => localStorage.removeItem(SYNC_KEY))
          .catch((error) => {
            console.error("Falha ao sincronizar notificacoes:", error);
          });
      }, 1800);
    }

    if (!installed || localStorage.getItem(WELCOME_KEY) === "true") return;

    const showTimer = window.setTimeout(() => setIsVisible(true), 900);

    if (!appId) {
      setStatus("not-configured");
      return () => window.clearTimeout(showTimer);
    }

    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setStatus("unsupported");
      return () => window.clearTimeout(showTimer);
    }

    if (Notification.permission === "granted") {
      setStatus("success");
    }

    return () => window.clearTimeout(showTimer);
  }, []);

  const loadOneSignal = () =>
    new Promise<OneSignalClient>((resolve, reject) => {
      if (oneSignal) {
        resolve(oneSignal);
        return;
      }

      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async (client) => {
        try {
          await client.init({ appId, notifyButton: { enable: false } });
          setOneSignal(client);
          resolve(client);
        } catch (error) {
          reject(error);
        }
      });

      if (document.querySelector("script[data-onesignal-sdk]")) return;

      const script = document.createElement("script");
      script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
      script.defer = true;
      script.dataset.onesignalSdk = "true";
      script.onerror = () =>
        reject(new Error("Nao foi possivel carregar o servico de notificacoes."));
      document.head.appendChild(script);
    });

  const requestNotifications = async () => {
    if (!appId) {
      setStatus("not-configured");
      return;
    }

    if (!("Notification" in window)) {
      setStatus("unsupported");
      return;
    }

    try {
      setStatus("loading");
      setErrorDetail("");

      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      localStorage.setItem(WELCOME_KEY, "true");
      localStorage.setItem(SYNC_KEY, "true");
      setStatus("success");
      window.setTimeout(() => setIsVisible(false), 1200);
      window.setTimeout(() => {
        loadOneSignal()
          .then(() => localStorage.removeItem(SYNC_KEY))
          .catch((error) => {
            console.error("Falha ao finalizar notificacoes:", error);
          });
      }, 2200);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      console.error("Falha ao solicitar notificacoes:", detail);
      setErrorDetail(detail);
      setStatus("failed");
    }
  };

  const dismiss = () => {
    localStorage.setItem(WELCOME_KEY, "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const buttonDisabled = status === "loading" || status === "success";

  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-cris-navy/70 p-3 backdrop-blur-sm sm:items-center">
      <section
        aria-modal="true"
        className="relative mx-auto w-full max-w-md overflow-hidden rounded-lg bg-cris-navy p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] text-white shadow-[0_24px_80px_rgba(7,16,70,0.5)] sm:p-6"
        role="dialog"
      >
        <div
          aria-hidden="true"
          className="paint-stroke absolute -right-10 top-6 h-9 w-44 bg-cris-pink"
        />
        <div className="relative max-w-2xl">
          <h2 className="text-3xl font-black uppercase leading-tight text-white">
            Bem-vinda ao Zumba do Cris!
          </h2>
          <p className="mt-4 text-sm font-black uppercase text-cris-yellow">
            Ative as notificacoes
          </p>
          <p className="mt-3 text-base font-bold leading-relaxed text-white/80">
            Receba novidades, lembretes das aulas e avisos importantes do Zumba
            do Cris direto no seu celular.
          </p>

          <button
            className="mt-5 min-h-12 rounded-lg bg-cris-yellow px-5 py-3 text-sm font-black uppercase text-cris-navy shadow-[0_10px_25px_rgba(255,196,0,0.22)] transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-cris-pink/45 disabled:cursor-default disabled:opacity-70"
            disabled={buttonDisabled}
            onClick={requestNotifications}
            type="button"
          >
            {status === "loading"
              ? "Preparando notificacoes..."
              : status === "success"
                ? "Notificacoes ativadas"
                : "Ativar notificacoes"}
          </button>

          <div aria-live="polite">
            {messages[status] ? (
              <p
                className={`mt-4 rounded-lg px-4 py-3 text-sm font-black ${
                  status === "success"
                    ? "bg-cris-pink text-white"
                    : "bg-white/10 text-white"
                }`}
              >
                {messages[status]}
              </p>
            ) : null}
            {status === "failed" && errorDetail ? (
              <p className="mt-2 break-words text-xs font-bold text-white/65">
                Detalhe: {errorDetail}
              </p>
            ) : null}
          </div>

          <button
            className="mt-3 min-h-11 w-full rounded-lg px-4 py-2 text-sm font-black uppercase text-white/75"
            onClick={dismiss}
            type="button"
          >
            Agora nao
          </button>
        </div>
      </section>
    </div>
  );
}
