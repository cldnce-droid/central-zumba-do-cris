"use client";

import { useEffect, useState } from "react";

type OneSignalSdk = {
  init: (options: {
    appId: string;
    serviceWorkerPath?: string;
    serviceWorkerUpdaterPath?: string;
    serviceWorkerParam?: { scope: string };
  }) => Promise<void> | void;
  Notifications?: {
    requestPermission: () => Promise<boolean>;
  };
  User?: {
    PushSubscription?: {
      optIn?: () => Promise<void>;
    };
  };
};

declare global {
  interface Window {
    OneSignalDeferred?: Array<(oneSignal: OneSignalSdk) => void | Promise<void>>;
  }
}

type NotificationStatus =
  | "loading"
  | "idle"
  | "success"
  | "denied"
  | "unsupported"
  | "failed";

const WELCOME_KEY = "zdc-notification-welcome-seen-v6";
const ONESIGNAL_APP_ID = normalizeAppId(
  process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
);
let oneSignalReady: Promise<OneSignalSdk> | null = null;

const messages: Partial<Record<NotificationStatus, string>> = {
  success: "Notificacoes ativadas com sucesso!",
  denied: "Tudo bem! Voce ainda pode acompanhar os avisos por aqui.",
  unsupported: "Seu navegador ainda nao permite notificacoes.",
  failed: "Nao foi possivel ativar agora. Tente novamente."
};

function normalizeAppId(value: string | undefined) {
  const match = String(value ?? "").match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
  );
  return match?.[0] ?? "";
}

function loadOneSignalScript() {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src*="OneSignalSDK.page.js"]'
    );

    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Falha ao carregar OneSignal."));
    document.head.appendChild(script);
  });
}

function isAppIdMismatch(error: unknown) {
  const detail = error instanceof Error ? error.message : String(error);
  return (
    detail.toLowerCase().includes("appid") &&
    detail.toLowerCase().includes("match")
  );
}

function deleteDatabase(name: string) {
  return new Promise<void>((resolve) => {
    if (!("indexedDB" in window)) {
      resolve();
      return;
    }

    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
}

async function getOneSignalDatabaseNames() {
  const indexedDbWithList = indexedDB as IDBFactory & {
    databases?: () => Promise<Array<{ name?: string }>>;
  };

  if (!indexedDbWithList.databases) {
    return ["ONE_SIGNAL_SDK_DB", "OneSignalSDK"];
  }

  const databases = await indexedDbWithList.databases();
  const discovered = databases
    .map((database) => database.name)
    .filter((name): name is string => Boolean(name))
    .filter((name) => name.toLowerCase().includes("onesignal"));

  return Array.from(
    new Set([...discovered, "ONE_SIGNAL_SDK_DB", "OneSignalSDK"])
  );
}

async function resetOneSignalRegistration() {
  localStorage.removeItem(WELCOME_KEY);
  [localStorage, sessionStorage].forEach((storage) => {
    Object.keys(storage)
      .filter((key) => key.toLowerCase().includes("onesignal"))
      .forEach((key) => storage.removeItem(key));
  });

  if ("caches" in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
  }

  const databaseNames = await getOneSignalDatabaseNames();
  await Promise.all(databaseNames.map(deleteDatabase));

  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map((registration) => registration.unregister())
    );
  }

  oneSignalReady = null;
}

async function getOneSignal() {
  if (!ONESIGNAL_APP_ID) return null;

  if (!oneSignalReady) {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    oneSignalReady = new Promise<OneSignalSdk>((resolve, reject) => {
      window.OneSignalDeferred?.push(async (oneSignal) => {
        try {
          await oneSignal.init({
            appId: ONESIGNAL_APP_ID,
            serviceWorkerPath: "/OneSignalSDKWorker.js",
            serviceWorkerUpdaterPath: "/OneSignalSDKUpdaterWorker.js",
            serviceWorkerParam: { scope: "/" }
          });
          resolve(oneSignal);
        } catch (error) {
          reject(error);
        }
      });

      loadOneSignalScript().catch(reject);
    });
  }

  return oneSignalReady;
}

export function NotificationOptIn() {
  const [isVisible, setIsVisible] = useState(false);
  const [status, setStatus] = useState<NotificationStatus>("idle");
  const [errorDetail, setErrorDetail] = useState("");

  useEffect(() => {
    const iosNavigator = navigator as Navigator & { standalone?: boolean };
    const installed =
      window.matchMedia("(display-mode: standalone)").matches ||
      iosNavigator.standalone === true;

    if (!installed || localStorage.getItem(WELCOME_KEY) === "true") return;

    const showTimer = window.setTimeout(() => setIsVisible(true), 900);

    if (!("Notification" in window)) {
      setStatus("unsupported");
      return () => window.clearTimeout(showTimer);
    }

    if (Notification.permission === "granted") {
      if (ONESIGNAL_APP_ID) {
        void getOneSignal()
          .then((oneSignal) => oneSignal?.User?.PushSubscription?.optIn?.())
          .then(() => localStorage.setItem(WELCOME_KEY, "true"))
          .catch(async (error) => {
            if (isAppIdMismatch(error)) {
              await resetOneSignalRegistration();
              window.location.reload();
              return;
            }
            setIsVisible(true);
          });
      } else {
        localStorage.setItem(WELCOME_KEY, "true");
      }
      return () => window.clearTimeout(showTimer);
    }

    return () => window.clearTimeout(showTimer);
  }, []);

  const requestNotifications = async () => {
    if (!("Notification" in window)) {
      setStatus("unsupported");
      return;
    }

    try {
      setStatus("loading");
      setErrorDetail("");

      const oneSignal = await getOneSignal();
      const permission = oneSignal?.Notifications
        ? await oneSignal.Notifications.requestPermission()
        : await Notification.requestPermission();

      if (permission !== true && permission !== "granted") {
        setStatus("denied");
        localStorage.setItem(WELCOME_KEY, "true");
        return;
      }

      await oneSignal?.User?.PushSubscription?.optIn?.();

      localStorage.setItem(WELCOME_KEY, "true");
      setStatus("success");
      window.setTimeout(() => setIsVisible(false), 1200);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      if (isAppIdMismatch(error)) {
        await resetOneSignalRegistration();
        setErrorDetail("Limpando registro antigo do OneSignal...");
        window.setTimeout(() => window.location.reload(), 700);
        return;
      }
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
