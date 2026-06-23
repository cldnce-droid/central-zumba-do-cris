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
    OneSignalDeferred?: Array<(oneSignal: OneSignalClient) => void | Promise<void>>;
  }
}

const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const WORKER_RELOAD_KEY = "zdc-onesignal-worker-reload";

const messages: Partial<Record<NotificationStatus, string>> = {
  success: "💖 Notificações ativadas com sucesso!",
  denied: "Tudo bem! Você ainda pode acompanhar os avisos por aqui.",
  unsupported: "Seu navegador ainda não permite notificações.",
  "not-configured": "As notificações ainda não foram configuradas.",
  failed: "Não foi possível ativar agora. Tente novamente."
};

export function NotificationOptIn() {
  const [status, setStatus] = useState<NotificationStatus>("idle");
  const [oneSignal, setOneSignal] = useState<OneSignalClient | null>(null);
  const [errorDetail, setErrorDetail] = useState("");

  useEffect(() => {
    sessionStorage.removeItem(WORKER_RELOAD_KEY);

    if (!appId) {
      setStatus("not-configured");
      return;
    }

    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setStatus("unsupported");
      return;
    }

    setStatus(Notification.permission === "granted" ? "success" : "idle");
  }, []);

  const loadOneSignal = () =>
    new Promise<OneSignalClient>((resolve, reject) => {
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
      script.onerror = () => reject(new Error("Não foi possível carregar o serviço de notificações."));
      document.head.appendChild(script);
    });

  const requestNotifications = async () => {
    if (!appId) {
      setStatus("not-configured");
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

      // Inicializa o provedor somente depois que o pop-up nativo foi concluído.
      if (!oneSignal) {
        const finishSetupWithReload = (event?: Event | PromiseRejectionEvent) => {
          event?.preventDefault();
          if (sessionStorage.getItem(WORKER_RELOAD_KEY) !== "pending") return;
          sessionStorage.setItem(WORKER_RELOAD_KEY, "done");
          window.location.replace("/avisos?notifications=enabled");
        };

        sessionStorage.setItem(WORKER_RELOAD_KEY, "pending");
        navigator.serviceWorker.addEventListener(
          "controllerchange",
          finishSetupWithReload,
          { once: true }
        );
        window.addEventListener("error", finishSetupWithReload, {
          capture: true,
          once: true
        });
        window.addEventListener("unhandledrejection", finishSetupWithReload, {
          once: true
        });

        const reloadFallback = window.setTimeout(
          () => finishSetupWithReload(),
          4000
        );
        await loadOneSignal();
        window.clearTimeout(reloadFallback);
        finishSetupWithReload();
        return;
      }
      setStatus("success");
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      console.error("Falha ao solicitar notificações:", detail);
      setErrorDetail(detail);
      setStatus("failed");
    }
  };

  const buttonDisabled = status === "loading" || status === "success";

  return (
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
            {status === "failed" && errorDetail ? (
              <p className="mt-2 break-words text-xs font-bold text-white/65">
                Detalhe: {errorDetail}
              </p>
            ) : null}
          </div>
        </div>
      </section>
  );
}
