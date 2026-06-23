"use client";

import Script from "next/script";
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
    OneSignalDeferred?: Array<(oneSignal: OneSignalClient) => void | Promise<void>>;
  }
}

const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

const messages: Partial<Record<NotificationStatus, string>> = {
  success: "💖 Notificações ativadas com sucesso!",
  denied: "Tudo bem! Você ainda pode acompanhar os avisos por aqui.",
  unsupported: "Seu navegador ainda não permite notificações.",
  "not-configured": "As notificações ainda não foram configuradas.",
  failed: "Não foi possível ativar agora. Tente novamente."
};

export function NotificationOptIn() {
  const [status, setStatus] = useState<NotificationStatus>("loading");
  const [oneSignal, setOneSignal] = useState<OneSignalClient | null>(null);

  useEffect(() => {
    if (!appId) {
      setStatus("not-configured");
      return;
    }

    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setStatus("unsupported");
      return;
    }

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (client) => {
      try {
        await client.init({
          appId,
          serviceWorkerPath: "sw.js",
          serviceWorkerParam: { scope: "/" },
          notifyButton: { enable: false }
        });
        setOneSignal(client);
        setStatus(client.Notifications.permission ? "success" : "idle");
      } catch {
        setStatus("failed");
      }
    });
  }, []);

  const requestNotifications = async () => {
    if (!oneSignal) {
      setStatus(appId ? "failed" : "not-configured");
      return;
    }

    try {
      await oneSignal.Notifications.requestPermission();
      setStatus(oneSignal.Notifications.permission ? "success" : "denied");
    } catch {
      setStatus("failed");
    }
  };

  const buttonDisabled = status === "loading" || status === "success";

  return (
    <>
      {appId ? (
        <Script
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
          strategy="afterInteractive"
        />
      ) : null}

      <section className="relative overflow-hidden rounded-lg bg-cris-navy p-5 text-white shadow-[0_20px_55px_rgba(7,16,70,0.22)] sm:p-6">
        <div
          aria-hidden="true"
          className="paint-stroke absolute -right-10 top-6 h-9 w-44 bg-cris-pink"
        />
        <div className="relative max-w-2xl">
          <p className="text-sm font-black uppercase text-cris-yellow">
            🔔 Ative as notificações
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
              ? "Preparando notificações..."
              : status === "success"
                ? "Notificações ativadas"
                : "Ativar notificações"}
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
          </div>
        </div>
      </section>
    </>
  );
}
