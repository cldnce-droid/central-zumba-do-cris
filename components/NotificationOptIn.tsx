"use client";

import { useEffect, useState } from "react";
import {
  getOneSignal,
  hasOneSignalAppId,
  isAppIdMismatch,
  resetOneSignalRegistration,
  waitForOneSignalSubscription
} from "@/lib/onesignalClient";

type NotificationStatus =
  | "loading"
  | "idle"
  | "success"
  | "denied"
  | "unsupported"
  | "failed";

const WELCOME_KEY = "zdc-notification-welcome-seen-v6";

const messages: Partial<Record<NotificationStatus, string>> = {
  success: "Notificacoes ativadas com sucesso!",
  denied: "Tudo bem! Voce ainda pode acompanhar os avisos por aqui.",
  unsupported: "Seu navegador ainda nao permite notificacoes.",
  failed: "Nao foi possivel ativar agora. Tente novamente."
};

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
      if (hasOneSignalAppId()) {
        void getOneSignal()
          .then((oneSignal) => oneSignal?.User?.PushSubscription?.optIn?.())
          .then(() => localStorage.setItem(WELCOME_KEY, "true"))
          .catch(() => {
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
      if (!oneSignal) {
        throw new Error("OneSignal nao inicializou neste dispositivo.");
      }

      const permission = oneSignal?.Notifications
        ? await oneSignal.Notifications.requestPermission()
        : false;

      if (!permission) {
        setStatus("denied");
        localStorage.setItem(WELCOME_KEY, "true");
        return;
      }

      await oneSignal?.User?.PushSubscription?.optIn?.();
      const subscribed = await waitForOneSignalSubscription(oneSignal);

      if (!subscribed) {
        throw new Error(
          "Permissao liberada, mas o celular ainda nao entrou no OneSignal."
        );
      }

      localStorage.setItem(WELCOME_KEY, "true");
      setStatus("success");
      window.setTimeout(() => setIsVisible(false), 1200);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      if (isAppIdMismatch(error)) {
        await resetOneSignalRegistration(WELCOME_KEY);
        setStatus("failed");
        setErrorDetail(
          "Registro antigo limpo. Feche o app, abra novamente e tente ativar."
        );
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
